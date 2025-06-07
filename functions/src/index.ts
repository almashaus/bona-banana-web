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
