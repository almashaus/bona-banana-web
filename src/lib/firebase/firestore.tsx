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
import { AppUser } from "@/src/models/user";

export async function getEvents() {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map((doc) => {
      const data = formatEventsDates(doc.data(), true);

      return data as Event;
    });
    return events;
  } catch (error) {
    throw new Error(`${error}`);
  }
}

export async function getEventsByStatus(status: EventStatus) {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("status", "==", status),
      orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(eventsQuery);

    const events = querySnapshot.docs.map((doc) => {
      const data = formatEventsDates(doc.data(), true);

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

    const documents = querySnapshot.docs.map((doc) => {
      return doc.data();
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
    console.error("Error:", error);
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
      throw new Error("Error fetching data!");
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

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating data:", error);
    throw new Error("Failed to update data. Please try again later.");
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

export async function deleteField(
  collectionName: string,
  docId: string,
  fieldName: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        [fieldName]: null,
      });
    } else {
      throw new Error(`Document with ID ${docId} does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting subcollection:", error);
    throw new Error("Failed to delete subcollection. Please try again later.");
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

export async function getUsersWithDashboardAccess(): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("hasDashboardAccess", "==", true));
    const querySnapshot = await getDocs(q);

    const usersWithDashboard: AppUser[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as AppUser;
      return data;
    });
    return usersWithDashboard;
  } catch (error) {
    console.error("Failed to fetch users with dashboard access:", error);
    return [];
  }
}
