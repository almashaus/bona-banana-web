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
  syncUserWithFirestore,
} from "@/src/lib/firebase/firestore";
import type { AppUser, DashboardUser } from "@/src/models/user";

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerMember: (memebr: AppUser, password: string) => Promise<void>;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

// Use sessionStorage for less persistent storage (mitigates XSS persistence)
const getUserFromStorage = (): AppUser | null => {
  if (typeof window === "undefined") return null;
  const storedUser = sessionStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};
const setUserToStorage = (user: AppUser) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("user", JSON.stringify(user));
};
const removeUserFromStorage = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("user");
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const router = useRouter();

  // Map FirebaseUser to AppUser
  const mapFirebaseUserToAppUser = (fbUser: FirebaseUser): AppUser => ({
    id: fbUser.uid,
    email: fbUser.email || "",
    name: fbUser.displayName || fbUser.email?.split("@")[0] || "",
    phoneNumber: fbUser.phoneNumber || "",
    profileImage: fbUser.photoURL || "",
    birthDate: "",
    gender: "",
    hasDashboardAccess: false,
  });

  useEffect(() => {
    // On mount, check session storage for user (for SSR hydration)
    if (!user) {
      const storedUser = getUserFromStorage();
      if (storedUser) {
        setUser(storedUser);
      }
    }

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!loading) {
        if (fbUser) {
          try {
            const appUser = await getDocumentById("users", fbUser.uid);
            if (appUser) {
              setUser(appUser as AppUser);
              setUserToStorage(appUser as AppUser);
            }
          } catch {
            setUser(null);
            removeUserFromStorage();
          }
        } else {
          setUser(null);
          removeUserFromStorage();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
    } catch {
      throw new Error("Login failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const fbUser = result.user;

        if (fbUser) {
          await updateProfile(fbUser, {
            displayName: name || email?.split("@")[0],
          });

          const appUser = mapFirebaseUserToAppUser(fbUser);
          setUser(appUser);
          setUserToStorage(appUser);
          await addDocToCollection("users", appUser, appUser.id);
        }
      } catch {
        throw new Error("Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [mapFirebaseUserToAppUser]
  );

  const registerMember = useCallback(
    async (memebr: AppUser, password: string) => {
      setLoading(true);
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          memebr.email,
          password
        );
        const fbUser = result.user;

        if (fbUser) {
          await updateProfile(fbUser, {
            displayName: memebr.name || memebr.email?.split("@")[0],
          });

          await addDocToCollection(
            "users",
            { ...memebr, id: fbUser.uid },
            fbUser.uid
          );
        }
      } catch (error) {
        console.error(error);
        throw new Error("Registration failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    signOut(auth)
      .then(() => {
        setUser(null);
        removeUserFromStorage();
        router.push("/login");
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
        await updateProfile(fbUser, {
          displayName: fbUser.displayName || fbUser.email?.split("@")[0],
        });

        const appUser = mapFirebaseUserToAppUser(fbUser);
        setUser(appUser);
        setUserToStorage(appUser);
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
        login,
        register,
        registerMember,
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
