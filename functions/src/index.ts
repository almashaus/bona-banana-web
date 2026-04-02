import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/*
  [ 1 ]
  Triggered when a user is deleted
*/
export const deleteUserDoc = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    await db.collection("users").doc(uid).delete();
  } catch (error) {
    console.error(`Error deleting user`);
  }
});

/*
  [ 2 ]
  Triggered when change a user to admin 
*/
export const onMemberAdded = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    if (!change) {
      return;
    }
    try {
      const before = change.before.data();
      const after = change.after.data();

      // if hasDashboardAccess changes to true only
      if (
        before.hasDashboardAccess !== true &&
        after.hasDashboardAccess === true
      ) {
        const dashboard = {
          dashboard: {
            role: "Support",
            status: "Active",
            joinedDate: new Date().toISOString(),
            eventsManaged: 0,
          },
        };

        // update the user document with dashboard data
        await db.collection("users").doc(after.id).update(dashboard);

        // add admin custom claims
        const customClaims = {
          admin: true,
        };

        await auth.setCustomUserClaims(after.id, customClaims);
      }
    } catch (error) {
      console.error(`Error creating dashboard for admin user`, error);
    }
  });

/*
  [ 3 ]
  Scheduled function: Change event status from "published" to "completed" if its date has passed
*/
export const completePastEvents = functions.pubsub
  .schedule("every day 00:05")
  .timeZone("Asia/Riyadh")
  .onRun(async () => {
    const TZ = "Asia/Riyadh";

    // Format a Date into YYYY-MM-DD in a specific timezone (Saudi)
    const dayKey = (d: Date) => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);

      const y = parts.find((p) => p.type === "year")?.value;
      const m = parts.find((p) => p.type === "month")?.value;
      const da = parts.find((p) => p.type === "day")?.value;

      // If Intl fails for any reason, do not risk completing events incorrectly
      if (!y || !m || !da) return null;

      return `${y}-${m}-${da}`; // lexicographically sortable
    };

    const todayKey = dayKey(new Date());
    if (!todayKey) return null;

    const eventsSnap = await db
      .collection("events")
      .where("status", "==", "published")
      .get();

    const commits: Promise<FirebaseFirestore.WriteResult[]>[] = [];
    let batch = db.batch();
    let count = 0;

    eventsSnap.forEach((doc) => {
      const event = doc.data();
      const dates = Array.isArray(event.dates) ? event.dates : [];

      // Find latest "Saudi day" among all date strings
      let latestKey: string | null = null;

      for (const d of dates) {
        if (typeof d?.date !== "string") continue;

        const parsed = new Date(d.date);
        if (Number.isNaN(parsed.getTime())) continue;

        const k = dayKey(parsed);
        if (!k) continue;

        if (!latestKey || k > latestKey) latestKey = k;
      }

      if (!latestKey) return;

      // Only complete if the latest Saudi day is strictly before today Saudi day
      if (latestKey < todayKey) {
        batch.update(doc.ref, { status: "completed" });
        count++;

        if (count === 500) {
          commits.push(batch.commit());
          batch = db.batch();
          count = 0;
        }
      }
    });

    if (count > 0) commits.push(batch.commit());
    if (commits.length) await Promise.all(commits);

    return null;
  });

/*
  [ 4 ]
  Callable function to verfiy ID token
*/
export const verifyIdToken = functions.https.onCall(async (data, context) => {
  const idToken = data.idToken;
  if (!idToken) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "ID token is required.",
    );
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Invalid ID token.",
      );
    }
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: decodedToken,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/*
  [ 5 ]
  Triggered when a new event is added; increments eventsManaged for the creator
*/
export const onEventCreated = functions.firestore
  .document("events/{eventId}")
  .onCreate(async (snap, context) => {
    const eventData = snap.data();
    const creatorId = eventData?.creatorId;
    if (!creatorId) {
      return;
    }
    try {
      // Increment dashboard.eventsManaged by 1 for the user
      await db
        .collection("users")
        .doc(creatorId)
        .update({
          "dashboard.eventsManaged": admin.firestore.FieldValue.increment(1),
        });

      await addActivityLog(
        creatorId,
        `Created event '${eventData.title}'`,
        "Event Management",
      );
    } catch (error) {
      console.error(
        `Error incrementing eventsManaged for user ${creatorId}:`,
        error,
      );
    }
  });

/*
  [ 6 ]
  Triggered when a new ticket is added; decrements availableTickets for the event date
*/
export const onTicketCreated = functions.firestore
  .document("tickets/{ticketId}")
  .onCreate(async (snap, context) => {
    const ticket = snap.data();
    const { eventId, eventDateId } = ticket || {};
    if (!eventId || !eventDateId) {
      return;
    }
    try {
      const eventRef = db.collection("events").doc(eventId);
      await db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists) return;

        const eventData = eventDoc.data();
        const dates = eventData?.dates || [];
        const updatedDates = dates.map((date: any) => {
          if (date.id === eventDateId) {
            const currentAvailable = date.availableTickets || 0;
            return {
              ...date,
              availableTickets: currentAvailable > 0 ? currentAvailable - 1 : 0,
            };
          }
          return date;
        });

        transaction.update(eventRef, { dates: updatedDates });
      });
    } catch (error) {
      console.error(
        `Error decrementing availableTickets for event ${eventId}, date ${eventDateId}:`,
        error,
      );
    }
  });

/*
  [ 8 ]
  Triggered when an event date's capacity is updated; adjusts availableTickets accordingly
*/
export const onEventDateCapacityChanged = functions.firestore
  .document("events/{eventId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    const beforeDates = before.dates || [];
    const afterDates = after.dates || [];

    // Map dates by id for easy lookup
    const beforeDatesMap = Object.fromEntries(
      beforeDates.map((d: any) => [d.id, d]),
    );

    const updatedDates = afterDates.map((afterDate: any) => {
      const beforeDate = beforeDatesMap[afterDate.id];
      if (
        beforeDate &&
        typeof beforeDate.capacity === "number" &&
        typeof afterDate.capacity === "number" &&
        beforeDate.capacity !== afterDate.capacity
      ) {
        const diff = afterDate.capacity - beforeDate.capacity;
        const prevAvailable =
          typeof afterDate.availableTickets === "number"
            ? afterDate.availableTickets
            : beforeDate.availableTickets || 0;
        return {
          ...afterDate,
          availableTickets: prevAvailable + diff,
        };
      }
      return afterDate;
    });

    // Only update if any date's availableTickets changed
    const shouldUpdate = updatedDates.some((d: any, idx: number) => {
      return d.availableTickets !== afterDates[idx].availableTickets;
    });

    if (shouldUpdate) {
      await change.after.ref.update({ dates: updatedDates });
    }
  });

/*
  [ 9 ]
  Triggered when a ticket status is changed to "Canceled"; increases availableTickets for the event date
*/
export const onTicketCanceled = functions.firestore
  .document("tickets/{ticketId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    // Only act if status changed to "Canceled" from something else
    if (
      before.status !== "Canceled" &&
      after.status === "Canceled" &&
      after.eventId &&
      after.eventDateId
    ) {
      const eventRef = db.collection("events").doc(after.eventId);

      await db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists) return;

        const eventData = eventDoc.data();
        const dates = eventData?.dates || [];
        const updatedDates = dates.map((date: any) => {
          if (date.id === after.eventDateId) {
            const currentAvailable = date.availableTickets || 0;
            return {
              ...date,
              availableTickets: currentAvailable + 1,
            };
          }
          return date;
        });

        transaction.update(eventRef, { dates: updatedDates });
      });
    }
  });

/*
  [ 9 ]
  Triggered when an Event is Updated 
*/
export const onEventUpdated = functions.firestore
  .document("events/{eventId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    const userId = after.updatedBy;
    if (!userId) return;

    // Detect changed fields between `before` and `after`
    const changedFields: string[] = [];

    Object.keys(after).forEach((key) => {
      if (["updatedAt", "createdAt"].includes(key)) return;

      const beforeValue = before[key];
      const afterValue = after[key];

      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedFields.push(key);
      }
    });

    let changesDescription = "";
    if (changedFields.length > 0) {
      changesDescription = ` (${changedFields.join(", ")} changed)`;
    }

    // Build the activity log action
    const action = `Updated event "${after.title}" ${changesDescription}`;

    // Write log
    await addActivityLog(userId, action, "Event Management");
  });

export const onUserRoleChanged = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const before = change.before.data();

    if (
      before.dashboard?.role !== after.dashboard?.role ||
      before.dashboard?.status !== after.dashboard?.status
    ) {
      const userId = after.id;
      if (!userId) return;

      await addActivityLog(
        userId,
        "Edited member permissions",
        "User Management",
      );
    }
  });

//-----------------------------------------------
export const addActivityLog = async (
  userId: string,
  action: string,
  type: "Event Management" | "User Management" | "Settings",
) => {
  const logRef = admin
    .firestore()
    .collection("users")
    .doc(userId)
    .collection("activityLog")
    .doc();

  const logEntry = {
    id: logRef.id,
    action,
    timestamp: new Date().toISOString(),
    type,
  };

  await logRef.set(logEntry);
};

/*
  [ 10 ]
  Scheduled function: Cancel orders that have been Pending for more than 15 minutes.
  Runs every 5 minutes. Canceling tickets triggers onTicketCanceled which restores availableTickets.
*/
export const cancelStalePendingOrders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const snapshot = await db
      .collection("orders")
      .where("status", "==", "Pending")
      .where("orderDate", "<=", cutoff)
      .get();

    if (snapshot.empty) return null;

    const ticketPromises = snapshot.docs.map((doc) =>
      db.collection("tickets").where("orderId", "==", doc.id).get()
    );
    const ticketSnapshots = await Promise.all(ticketPromises);

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "Canceled" });
    });

    ticketSnapshots.forEach((snap) => {
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { status: "Canceled" });
      });
    });

    await batch.commit();
    console.log(`Canceled ${snapshot.size} stale pending order(s)`);
    return null;
  });

/*
Deploy the functions command:
`firebase deploy --only functions`
*/
