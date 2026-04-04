"use client";

import { AuthProvider } from "@/app/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3500,
          className: "auth-toast",
          style: {
            background: "transparent",
            padding: 0,
            boxShadow: "none",
          },
        }}
      />
    </AuthProvider>
  );
}
