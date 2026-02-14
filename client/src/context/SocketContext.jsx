import { createContext, useEffect, useState, useContext, useRef } from "react";
import io from "socket.io-client";
import { UserContext } from "./UserContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useContext(UserContext);
  const socketRef = useRef(null); // prevent multiple instances

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) {
      console.log("[Socket] No user ID yet → waiting");
      return;
    }

    // Already have a working socket → don't recreate
    if (socketRef.current?.connected) {
      console.log("[Socket] Already connected → skipping new connection");
      return;
    }

    console.log(`[Socket] Creating new connection for user: ${userId}`);

    const newSocket = io("https://chatifyzone07.onrender.com", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
    });

    newSocket.on("connect", () => {
      console.log(`[Socket] CONNECTED → ID: ${newSocket.id}`);
      newSocket.emit("register_node", userId);
    });

    newSocket.on("get_online_nodes", (users) => {
      console.log("[Socket] Online users updated:", users);
      setOnlineUsers(users);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected → reason:", reason);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log("[Socket] Cleaning up old socket...");
      if (newSocket) {
        newSocket.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?._id, user?.id]); // Depend on both possible ID fields

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
