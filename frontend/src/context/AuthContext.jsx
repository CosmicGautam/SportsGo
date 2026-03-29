// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

function readStoredAuth() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw || raw === "undefined") return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readStoredAuth);

  // auth shape: { token, user: { _id, name, email, role } }

  const login = (data) => {
    setAuth(data);
    localStorage.setItem("auth", JSON.stringify(data));
    // Also store token separately for backward compat with existing interceptors
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
  };

  // Convenience role helpers
  const user       = auth?.user || null;
  const token      = auth?.token || null;
  const isLoggedIn = !!auth;
  const isUser     = user?.role === "user";
  const isProvider = user?.role === "provider";
  const isSuperAdmin = user?.role === "superadmin";
  const isStaff    = isProvider || isSuperAdmin; // can manage courts

  return (
    <AuthContext.Provider value={{
      auth, user, token,
      isLoggedIn, isUser, isProvider, isSuperAdmin, isStaff,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);