"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const getEmailVerificationLink = async (email: string) => {
  const res = await api.post(`/auth/register?email=${email}`, { public: true });

  if (res.error) {
    throw new Error(res.error || "Failed to get verification link");
  }

  return;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function InitialRegisterPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const emailIsValid = isValidEmail(email);
  const showEmailError = touched && email !== "" && !emailIsValid;

  const handleSubmit = async () => {
    if (!emailIsValid || loading) return;

    setLoading(true);
    setError("");

    try {
      await getEmailVerificationLink(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-purple-700 dark:text-purple-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Check your inbox
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We sent a verification link to{" "}
            <span className="font-medium text-purple-700 dark:text-purple-400">
              {email}
            </span>
            . Click it to continue registration.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className="text-sm text-purple-700 dark:text-purple-400 underline underline-offset-2 mt-2"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 md:flex md:flex-col p-4 py-8 md:px-60 md:pb-16 dark:text-gray-400">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="my-8">
          <h1 className="my-2 text-3xl md:text-center dark:text-gray-200">
            Sign Up to AVE.
          </h1>
          <p className="text-purple-600 md:text-center text-sm">
            Enter your email to get started.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {/* Email field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onBlur={() => setTouched(true)}
              className={`border-2 rounded-lg h-10 p-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 outline-none transition-colors
                ${
                  showEmailError || error
                    ? "border-red-500 focus:border-red-500"
                    : "border-purple-900 focus:border-purple-600"
                }`}
            />
            {showEmailError && (
              <p className="text-xs text-red-600 dark:font-extrabold">
                Please enter a valid email address.
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 dark:font-extrabold">
                {error}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!emailIsValid || loading}
            className={`my-2 p-2 w-full bg-purple-600 rounded text-white text-sm font-medium transition duration-300 ease-out hover:shadow-lg dark:bg-purple-700 dark:hover:bg-purple-800 flex items-center justify-center gap-2
              ${!emailIsValid || loading ? "opacity-60 cursor-not-allowed" : "opacity-100"}`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              "Send verification link"
            )}
          </button>

          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/#login"
              className="text-purple-600 font-medium underline underline-offset-2 hover:text-purple-800"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
