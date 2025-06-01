"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
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
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { syncUserWithFirestore } from "@/src/lib/firebase/firestore";

type User = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

// Local storage helpers
const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};
const setUserToStorage = (user: User) => {
  localStorage.setItem("user", JSON.stringify(user));
};
const removeUserFromStorage = () => {
  localStorage.removeItem("user");
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const setAuthUser = useAuthStore((state) => state.setUser);

  // Helper to convert FirebaseUser to our User type
  const mapFirebaseUser = (fbUser: FirebaseUser, token?: string): User => ({
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split("@")[0] || "",
    email: fbUser.email || "",
    isAdmin: fbUser.email?.includes("admin") || false,
    token: token || "",
  });

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setAuthUser(fbUser);
        syncUserWithFirestore(fbUser);

        const mappedUser = mapFirebaseUser(fbUser);
        setUser(mappedUser);
        setUserToStorage(mappedUser);
      } else {
        setUser(null);
        removeUserFromStorage();
      }
      setLoading(false);
    });
    // On mount, check local storage for user (for SSR hydration)
    if (!user) {
      const storedUser = getUserFromStorage();
      if (storedUser) setUser(storedUser);
    }
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = result.user;
      const token = await fbUser.getIdToken();

      const mappedUser = mapFirebaseUser(fbUser, token);
      setUser(mappedUser);
      setUserToStorage(mappedUser);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const fbUser = result.user;

      if (fbUser && name) {
        await updateProfile(fbUser, { displayName: name });
      }
      const mappedUser = mapFirebaseUser(fbUser, name);
      setUser(mappedUser);
      setUserToStorage(mappedUser);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        removeUserFromStorage();
        router.push("/login");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      const fbUser = result.user;
      const mappedUser = mapFirebaseUser(fbUser);
      setUser(mappedUser);
      setUserToStorage(mappedUser);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
