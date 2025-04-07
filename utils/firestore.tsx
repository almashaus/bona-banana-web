import { doc, getDoc } from "firebase/firestore";
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
      throw new Error("No such document!");
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};
