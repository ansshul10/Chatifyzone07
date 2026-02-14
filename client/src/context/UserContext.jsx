import { createContext, useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/profile');
        setUser(data); // ab privacy bhi aayegi
        setReady(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
        setReady(true);
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, ready }}>
      {children}
    </UserContext.Provider>
  );
}