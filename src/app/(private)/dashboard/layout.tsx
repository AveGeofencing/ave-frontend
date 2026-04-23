"use client";

import AuthenticatedNav from "@/components/AuthenticatedNav/AuthenticatedNav";
import OpenModal from "@/components/OpenModal/OpenModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLogoutModal, updateShowLogoutModal] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <OpenModal hidden={!showLogoutModal}>
        <div className="flex flex-col p-8 px-2 gap-12 md:gap-16 text-sm  dark:text-gray-300">
          <h1 className="font-bold text-xl text-black text-center sm:text-2xl dark:text-white">
            Are you sure you want to log out?
          </h1>
          <div className={`flex gap-3 justify-center w-full md:scale-125`}>
            <>
              <button
                onClick={handleLogout}
                className="
                  text-white bg-[var(--color-danger)] px-3 py-2 rounded hover-effect outline-none focus:border-2
                    hover:bg-[var(--color-danger-hover)]
                "
              >
                Yes, leave
              </button>
              <button
                onClick={() => updateShowLogoutModal(false)}
                className="
                  text-white bg-[var(--color-success)] px-3 py-2 rounded hover-effect 
                  hover:text-white hover:bg-[var(--color-success-hover)]
                "
              >
                No, go back
              </button>
            </>
          </div>
        </div>
      </OpenModal>
      <AuthenticatedNav handleLogout={() => updateShowLogoutModal(true)} />
      {children}
    </>
  );
}
