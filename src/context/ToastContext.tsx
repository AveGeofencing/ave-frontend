// context/ToastContext.tsx
"use client";

import Toast from "@/components/Alert/Alert";
import { createContext, useContext, useState } from "react";

interface ToastContextType {
  showToast: (message: string, isError?: boolean) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);
  const [isError, setIsError] = useState(false);

  const showToast = (message: string, isError?: boolean) => {
    setMessage(message);
    setShow(true);
    if (isError) {
      setIsError(isError);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast
        message={message}
        show={show}
        closeAlert={() => setShow(false)}
        isError={isError}
      />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
