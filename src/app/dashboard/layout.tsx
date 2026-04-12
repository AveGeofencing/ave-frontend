"use client";
import Cookies from "js-cookie";
import AuthenticatedNav from "@/components/AuthenticatedNav/AuthenticatedNav";
import { useState } from "react";
import OpenModal from "@/components/OpenModal/OpenModal";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner/Spinner";
import { AuthProvider } from "@/context/AuthContext";
// export const metadata: Metadata = {
//   title: "AVE",
//   description: "Attendance Management System",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLogoutModal, updateShowLogoutModal] = useState(false);
  const [logoutError, updateLogoutError] = useState({
    state: false,
    message: "",
  });
  const [logoutLoading, updateLogoutLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    updateLogoutLoading(true);
    Cookies.set("access_token", "", { expires: -1 });

    await api.delete("/auth/logout");
    router.push("/");
  };

  return (
    <>
      {/* LOGOUT MODAL */}
      <OpenModal hidden={!showLogoutModal}>
        <div className="flex flex-col p-8 px-2 gap-12 md:gap-16 text-sm dark:bg-gray-800 dark:text-gray-300">
          <h1 className="font-bold text-xl text-gray-700 text-center sm:text-2xl md:text-4xl dark:text-gray-400">
            Are you sure you want to log out?
          </h1>
          <div
            className={`flex gap-3 justify-center w-full md:scale-125 ${logoutError.state && "flex-col sm:px-6"} ${logoutLoading && logoutError.state ? "items-center" : ""}`}
          >
            {logoutError.state && (
              <div className="text-red-500 text-center self-center font-bold text-sm">
                {logoutError.message}
              </div>
            )}
            {logoutLoading ? (
              Spinner
            ) : (
              <>
                <button
                  onClick={() => handleLogout()}
                  className="text-red-500 border border-red-500 px-3 py-2 rounded hover-effect hover:text-white hover:bg-red-500"
                >
                  Yes, leave
                </button>
                <button
                  onClick={() => updateShowLogoutModal(false)}
                  className="text-green-500 border border-green-500 px-3 py-2 rounded hover-effect hover:text-white hover:bg-green-500"
                >
                  No, go back
                </button>
              </>
            )}
          </div>
        </div>
      </OpenModal>
      <AuthenticatedNav handleLogout={() => updateShowLogoutModal(true)} />
      <div>{children}</div>
    </>
  );
}
