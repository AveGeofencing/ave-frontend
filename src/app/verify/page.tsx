"use client";
import React, { ChangeEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const verifyToken = async (token: string) => {
  const res = await axios.post(
    `http://localhost:8000/auth/verify-email?token=${token}`,
  );
  return res.data;
};

const submitDetails = async (data: any) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/auth/create-user`,
    data,
  );
  return res.data;
};

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState({
    user_id: "",
    email: "",
    username: "",
    user_matric: "",
    password: "",
    role: "student",
  });

  const isFormValid =
    data.username.trim() !== "" &&
    data.user_matric.trim() !== "" &&
    data.password.trim() !== "";

  const [loading, setLoading] = useState<boolean>(false);
  const [verificationStatus, updateVerificationStatus] = useState<
    "success" | "idle" | "error"
  >("idle");

  useEffect(() => {
    if (!token) {
      updateVerificationStatus("error");
      return;
    }

    async function handleVerification() {
      updateVerificationStatus("idle");
      setLoading(true);

      try {
        const data = await verifyToken(token);
        setData((prev) => ({
          ...prev,
          email: data.user_email,
          user_id: data.user_id,
        }));
        setIsTokenVerified(true);
        updateVerificationStatus("success");
      } catch (error) {
        setIsTokenVerified(false);
        updateVerificationStatus("error");
      } finally {
        setLoading(false);
      }
    }

    handleVerification();
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await submitDetails(data);
      router.push("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case 409:
            setError("Username or matric number already taken");
            break;
          case 400:
            setError("Invalid details, please check your input");
            break;
          default:
            setError("Something went wrong, please try again");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="email-verification-page"
      className="to-white min-h-screen max-w-screen px-2 sm:p-8 py-12 md:flex md:justify-center md:items-center dark:bg-gray-900"
    >
      <div
        id="container"
        className="flex flex-col items-center md:border md:rounded md:shadow-inner md:p-8 md:w-fit"
      >
        <div className="rounded-full p-4 bg-purple-100 block w-fit dark:bg-purple-800">
          {/* mail icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-8 text-purple-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <form action="">
          <div className="py-4 text-center">
            <h1 className="text-2xl text-purple-900 text-center font-bold dark:text-gray-200">
              {isTokenVerified ? "Input your details" : "Verifying link..."}
            </h1>
          </div>
          {isTokenVerified && (
            <div className="flex flex-col gap-2 align-center justify-center">
              <input
                type="text"
                className="border-2 rounded-lg h-10 border-purple-900 p-2"
                placeholder="Username"
                value={data.username}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
              <input
                type="text"
                className="border-2 rounded-lg h-10 border-purple-900 p-2"
                placeholder="Matric Number"
                value={data.user_matric}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    user_matric: e.target.value,
                  }))
                }
              />
              <input
                type="password"
                className="border-2 rounded-lg h-10 border-purple-900 p-2"
                placeholder="Password"
                value={data.password}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          )}
          {!loading && verificationStatus !== "idle" ? ( // check if a response has returned
            verificationStatus == "error" ? (
              <p className="text-red-500 font-semibold text-center py-4 pt-6">
                This link could not be verified. It is either expired or
                invalid.
              </p> // based on response success or error
            ) : (
              <p className="text-green-500 font-bold text-center py-4 pt-6">
                Your email has been successfully verified.
              </p>
            )
          ) : (
            ""
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {isTokenVerified && (
            <button
              className="py-3 px-4 w-full text-center font-bold bg-purple-500 cursor-pointer text-white rounded-lg my-4 disabled:opacity-50 dark:bg-purple-700 dark:text-gray-300"
              disabled={!isFormValid || loading}
              onClick={(e) => {
                e.preventDefault(); // ✅ actually call it
                handleSubmit();
              }}
            >
              {loading ? "Submitting ..." : "Submit details"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Page;
