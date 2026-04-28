import { cookies } from "next/headers";
import { auth, db } from "@/src/lib/firebase/firebaseAdminConfig";
import { AppUser } from "@/src/models/user";

export async function getServerSession(): Promise<{
  user: AppUser | null;
  authenticated: boolean;
  expired?: boolean;
}> {
  try {
    const sessionCookie = cookies().get("session")?.value;
    if (!sessionCookie) {
      return { user: null, authenticated: false };
    }

    if (sessionCookie) {
      // Verify the session cookie with proper error handling
      let decoded;
      try {
        decoded = await auth.verifySessionCookie(sessionCookie, true);
      } catch (error: any) {
        // Handle expired session cookie
        if (error?.errorInfo?.code === "auth/session-cookie-expired") {
          // Delete the expired cookie
          cookies().delete("session");
          return { user: null, authenticated: false, expired: true };
        }

        // Handle revoked session cookie
        if (error?.errorInfo?.code === "auth/session-cookie-revoked") {
          cookies().delete("session");
          return { user: null, authenticated: false };
        }

        cookies().delete("session");
        return { user: null, authenticated: false };
      }

      // Fetch user data from Firestore Admin
      const userDoc = await db.collection("users").doc(decoded.uid).get();

      if (!userDoc.exists) {
        // User doesn't exist in database, clear cookie
        cookies().delete("session");
        return { user: null, authenticated: false };
      }

      const userData = userDoc.data() as AppUser;

      return {
        user: userData,
        authenticated: true,
      };
    } else {
      return { user: null, authenticated: false };
    }
  } catch (error) {
    // Clear potentially corrupted cookie
    // cookies().delete("session");
    return { user: null, authenticated: false };
  }
}

// For use in Server Components
export async function requireAuth() {
  const session = await getServerSession();

  if (!session.authenticated) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

// For middleware protection
export async function verifySession(sessionCookie: string) {
  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return { valid: true, uid: decodedClaims.uid };
  } catch (error: any) {
    // Return specific error type for better handling
    if (error?.errorInfo?.code === "auth/session-cookie-expired") {
      return { valid: false, uid: null, expired: true };
    }
    return { valid: false, uid: null };
  }
}
