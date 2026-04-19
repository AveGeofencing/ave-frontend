// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>; // add this
}

export const AuthContext = createContext<AuthContextType | null>(null);

/* Normally, I am supposed to use the AuthContext as a component *directly*, 
but I decided to create another component in order to wrap the AuthContext with, to provide extra (default) data to the context. 
*/
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    setLoading(true);
    const { data } = await api.get<User>("/auth/get-user");
    setUser(data);
    setLoading(false);
  };

  const logout = async () => {
    await api.delete("/auth/logout");
    Cookies.remove("access_token");
    setUser(null); // clears user from context immediately
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refetchUser: fetchUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
