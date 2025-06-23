import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  DocumentData,
  query,
  orderBy,
  where,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/firebaseConfig";
import { formatEventsDates } from "@/src/lib/utils/formatDate";
import { Event, EventStatus } from "@/src/models/event";
import { User } from "firebase/auth";
import { AppUser, DashboardUser } from "@/src/models/user";

export async function getEvents() {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map((doc) => {
      const data = formatEventsDates(doc.data(), false);

      return data as Event;
    });
    return events;
  } catch (error) {
    throw new Error("Error getting data!");
  }
}

export async function getEventsByStatus(status: string) {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("status", "==", status as EventStatus),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map((doc) => {
      const data = formatEventsDates(doc.data(), false);

      return data as Event;
    });
    return events;
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching data!");
  }
}

export const getAllDocuments = async (
  collectionName: string
): Promise<DocumentData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    if (querySnapshot.empty) {
      throw new Error("No documents found in the collection!");
    }

    const documents = querySnapshot.docs.map((doc) => {
      if (doc.exists()) {
        return doc.data();
      }
      throw new Error("No such data!");
    });
    return documents;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data!");
  }
};

export const getEventById = async (docId: string) => {
  try {
    const docRef = doc(db, "events", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const eventData = formatEventsDates(docSnap.data(), true);
      return eventData as Event;
    } else {
      throw new Error("No such data!");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data!");
  }
};

export const getDocumentById = async (
  collectionName: string,
  docId: string
): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data!");
  }
};

export async function addDocToCollection<T extends object>(
  collectionName: string,
  data: T,
  id?: string
): Promise<string> {
  try {
    if (id) {
      await setDoc(doc(db, collectionName, id), data);
      return id;
    } else {
      const docRef = doc(collection(db, collectionName));
      const dataWithId = { ...data, id: docRef.id };

      await setDoc(docRef, dataWithId);

      return docRef.id;
    }
  } catch (e) {
    console.error(e);
    throw new Error("Failed to insert data. Please try again later.");
  }
}

export async function addDocToSubCollection<T extends object>(
  collectionName: string,
  subcollectionName: string,
  data: T,
  id: string
): Promise<string> {
  try {
    const dashboardDocRef = doc(
      db,
      collectionName,
      id,
      subcollectionName,
      "default"
    );
    await setDoc(dashboardDocRef, data);

    return dashboardDocRef.id;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to insert data. Please try again later.");
  }
}

export async function deleteDocById(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return docId;
    } else {
      throw new Error(`Document with ID ${docId} does not exist.`);
    }
  } catch (error) {
    throw new Error("Failed to delete data. Please try again later.");
  }
}

export const syncUserWithFirestore = async (user: User) => {
  try {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then(async (userData) => {
      if (userData.data()?.hasDashboardAccess) {
        await updateDoc(userRef, { lastLogin: serverTimestamp() });
      }
    });
  } catch (error) {
    return;
  }
};

export async function getUserAndDashboard(
  userID: string
): Promise<AppUser | null> {
  try {
    // References to user and dashboard documents
    const userRef = doc(db, "users", userID);
    const dashboardRef = doc(db, "users", userID, "dashboard", "default");

    // Fetch documents
    const [userSnap, dashboardSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(dashboardRef),
    ]);

    // Check existence
    if (!userSnap.exists() || !dashboardSnap.exists()) {
      console.warn("User or Dashboard document does not exist.");
      return null;
    }

    const userData = userSnap.data() as AppUser;
    const dashboardData = dashboardSnap.data() as DashboardUser;

    return {
      ...userData,
      dashboard: dashboardData,
    };
  } catch (error) {
    console.error("Error fetching user and dashboard:", error);
    return null;
  }
}

export async function getUsersWithDashboardAccess(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("hasDashboardAccess", "==", true));
    const querySnapshot = await getDocs(q);

    const usersWithDashboard: AppUser[] = [];

    for (const docSnap of querySnapshot.docs) {
      const userData = docSnap.data() as AppUser;
      const userId = docSnap.id;

      const dashboardDocRef = doc(db, "users", userId, "dashboard", "default");
      const dashboardSnap = await getDoc(dashboardDocRef);

      let dashboardData: DashboardUser | undefined = undefined;
      if (dashboardSnap.exists()) {
        dashboardData = dashboardSnap.data() as DashboardUser;
      }

      usersWithDashboard.push({
        ...userData,
        dashboard: dashboardData,
      });
    }

    return usersWithDashboard;
  } catch (error) {
    console.error("Failed to fetch users with dashboard access:", error);
    return [];
  }
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  try {
    const eventRef = doc(db, collectionName, id);
    await updateDoc(eventRef, data);
  } catch (error) {
    console.error("Error updating data:", error);
    throw new Error("Failed to update data. Please try again later.");
  }
}

export async function updateSubcollectionField(
  collectionName: string,
  docId: string,
  subcollectionName: string,
  subDocId: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  try {
    const subDocRef = doc(
      db,
      collectionName,
      docId,
      subcollectionName,
      subDocId
    );
    await updateDoc(subDocRef, data);
  } catch (error) {
    console.error("Error updating data:", error);
    throw new Error("Failed to update data. Please try again later.");
  }
}

export async function deleteSubcollection(
  collectionName: string,
  docId: string,
  subcollectionName: string
): Promise<void> {
  try {
    const subColRef = collection(db, collectionName, docId, subcollectionName);
    const subColSnapshot = await getDocs(subColRef);

    const deletePromises = subColSnapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting subcollection:", error);
    throw new Error("Failed to delete subcollection. Please try again later.");
  }
}
