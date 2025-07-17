import { auth } from "@/src/lib/firebase/firebaseAdminConfig";

export async function verifyIdToken(authHeader: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}
