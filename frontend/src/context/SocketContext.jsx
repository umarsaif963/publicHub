import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../features/auth/context/AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      const newSocket = io("http://localhost:3001", {
        auth: { token },
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Socket Connected:", newSocket.id);
      });

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
