"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { auth } from "@/src/lib/firebase/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  addDocToCollection,
  getDocumentById,
} from "@/src/lib/firebase/firestore";
import type { AppUser } from "@/src/models/user";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  initialLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  // Map FirebaseUser to AppUser
  const mapFirebaseUserToAppUser = (fbUser: FirebaseUser): AppUser => ({
    id: fbUser.uid,
    email: fbUser.email || "",
    name: fbUser.displayName || fbUser.email?.split("@")[0] || "",
    phone: fbUser.phoneNumber || "",
    profileImage: fbUser.photoURL || "",
    birthDate: null,
    gender: "",
    hasDashboardAccess: false,
  });

  useEffect(() => {
    if (!user) {
      // Listen for Firebase Auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (fbUser) {
            const result = await getDocumentById("users", fbUser.uid);
            const appUser: AppUser = result as AppUser;
            if (appUser) {
              setUser(appUser as AppUser);
              setInitialLoading(false);
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        } finally {
          setInitialLoading(false);
          setLoading(false);
        }
      });

      return () => unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [loading, initialLoading, setUser, user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();

      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        throw new Error("too-many-requests");
      } else {
        throw new Error("invalid-credential");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      phone: string,
    ) => {
      setLoading(true);
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const fbUser = result.user;

        if (fbUser) {
          const idToken = await fbUser.getIdToken();

          await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          await updateProfile(fbUser, {
            displayName: name || email?.split("@")[0],
          });

          const appUser: AppUser = {
            ...mapFirebaseUserToAppUser(fbUser),
            phone: phone.trim(),
          };
          setUser(appUser);
          await addDocToCollection("users", appUser, appUser.id);
        }
      } catch {
        throw new Error("Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [mapFirebaseUserToAppUser],
  );

  const logout = useCallback(() => {
    signOut(auth)
      .then(async () => {
        await fetch("/api/logout");

        setUser(null);
        router.replace("/login");
      })
      .catch(() => {
        throw new Error("Logout failed");
      });
  }, [router]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      if (fbUser) {
        const idToken = await fbUser.getIdToken();

        await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        await updateProfile(fbUser, {
          displayName: fbUser.displayName || fbUser.email?.split("@")[0],
        });

        const appUser = mapFirebaseUserToAppUser(fbUser);
        setUser(appUser);
        await addDocToCollection("users", appUser, appUser.id);
      }
    } catch {
      throw new Error("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [mapFirebaseUserToAppUser]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      throw new Error("Reset password failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialLoading,
        login,
        register,
        logout,
        signInWithGoogle,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
