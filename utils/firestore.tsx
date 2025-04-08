import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

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
