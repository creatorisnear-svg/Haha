import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vaa_customer_token"));
  const [customer, setCustomer] = useState<Customer | null>(() => {
    const raw = localStorage.getItem("vaa_customer");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const login = (newToken: string, newCustomer: Customer) => {
    localStorage.setItem("vaa_customer_token", newToken);
    localStorage.setItem("vaa_customer", JSON.stringify(newCustomer));
    setToken(newToken);
    setCustomer(newCustomer);
  };

  const logout = () => {
    localStorage.removeItem("vaa_customer_token");
    localStorage.removeItem("vaa_customer");
    setToken(null);
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ customer, token, login, logout, isLoggedIn: !!token && !!customer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
