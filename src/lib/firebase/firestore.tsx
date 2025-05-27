import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  DocumentData,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/firebaseConfig";
import { formatEventsDates } from "@/src/lib/utils/formatDate";
import { Event } from "@/src/models/event";

export async function getEvents() {
  const eventsQuery = query(
    collection(db, "events"),
    orderBy("updated_at", "desc")
  );
  const querySnapshot = await getDocs(eventsQuery);
  const events = querySnapshot.docs.map((doc) => {
    const data = formatEventsDates(doc.data(), false);

    return data as Event;
  });
  return events;
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

export const getDocumentById = async (
  collectionName: string,
  docId: string
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("No such data!");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Error fetching data!");
  }
};

export async function deleteDocById(collectionName: string, docId: string) {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      console.log(`Document with ID ${docId} found and deleted.`);
      return docId;
    } else {
      throw new Error(`Document with ID ${docId} does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Failed to delete event. Please try again later.");
  }
}
