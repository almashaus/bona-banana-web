import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Triggered when a user is deleted
export const deleteUserDoc = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    await db.collection("users").doc(uid).delete();
    console.log(`User document deleted`);
  } catch (error) {
    console.error(`Error deleting user`);
  }
});

// Triggered when change a user to admin
export const onMemberAdded = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    if (!change) {
      console.log("No data associated with the event");
      return;
    }

    const before = change.before.data();
    const after = change.after.data();

    // Trigger only if hasDashboardAccess changes from false to true
    if (
      before.hasDashboardAccess !== true &&
      after.hasDashboardAccess === true
    ) {
      const dashboardData = {
        role: "Support",
        status: "Active",
        joinedDate: admin.firestore.FieldValue.serverTimestamp(),
        eventsManaged: 0,
      };

      await change.after.ref
        .collection("dashboard")
        .doc("default")
        .set(dashboardData);

      console.log(`Created dashboard for admin user`);
    }

    return null;
  });
