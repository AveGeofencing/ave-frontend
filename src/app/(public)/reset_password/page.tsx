"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OpenModal from "@/components/OpenModal/OpenModal";
import Image from "next/image";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner/Spinner";

const Page = () => {
  const token = useSearchParams().get("token");
  const router = useRouter();

  const [showSuccessModal, updateShowSuccessModal] = useState(false);
  const [loading, updateLaoding] = useState(false);
  const [error, updateError] = useState({ state: false, message: "" });

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleResetPassword = async (e: FormEvent) => {
    // get password value
    const password = (passwordRef.current as HTMLInputElement).value;

    if (password === "" && password.length < 5) {
      updateError({
        state: true,
        message: "Password must be at least 5 characters",
      });
      return;
    }

    updateError({ state: false, message: "" });
    updateLaoding(true);

    // call the reset password endpoint
    try {
      const response = await api.post("/user/reset_password", {
        new_password: password,
        token: token,
      });

      console.log(response);
      updateShowSuccessModal(true);
    } catch (error: any) {
      console.log(error);
      updateShowSuccessModal(false);
      updateError({
        state: true,
        message:
          "Password reset link has expired. Please request for a new one.",
      });

      if (error.status == 500) {
        updateError({
          state: true,
          message: "An error occured, contact Admin courageadedara@gmail.com",
        });
        return;
      }

      if (
        error.status == 401 &&
        error.response.data.detail.toLowerCase().includes("session")
      ) {
        // Session has expired, Redirect to the login page
        localStorage.removeItem("token");
        localStorage.removeItem("student_token");

        router.push("/");
      }
    } finally {
      updateLaoding(false);
    }
  };

  return (
    <div
      id="reset-password-page"
      className="flex flex-col gap-5 p-12 min-h-screen dark:bg-gray-900  dark:text-gray-400"
    >
      <OpenModal hidden={!showSuccessModal}>
        <div className="flex flex-col gap-5 items-center p-8 text-center dark:bg-gray-800 dark:text-gray-300">
          <Image
            src={"/success.svg"}
            className="mx-auto mt-5"
            width={100}
            height={100}
            alt="Success-Icon"
          />
          <h1 className="font-extrabold text-lg text-center dark:text-gray-200">
            {" "}
            Congratulations <br /> Your password has been reset successfully!
          </h1>
          <p className="text-sm">You can login with the new password now</p>
          <button
            className="py-2 mt-8 px-4 w-full border rounded cursor-pointer
                        transition duration-300 ease-out hover:border-green-600 hover:text-green-500"
            onClick={() => {
              updateShowSuccessModal(false);
              router.push("/");
            }}
          >
            Proceed to login
          </button>
        </div>
      </OpenModal>

      <div>
        <h1 className="text-2xl text-gray-600 text-center my-2 sm:text-3xl font-extrabold dark:text-gray-300">
          Enter your new desired password.
        </h1>
        <p className="text-xs text-center">
          Once completed, your account will use this new password
        </p>
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          handleResetPassword(e);
        }}
        className="flex flex-col justify-around"
      >
        <input
          type="password"
          ref={passwordRef}
          className="input"
          placeholder="Enter your new password"
        />
        {error.state && (
          <p className="text-red-500 font-bold text-sm">{error.message}</p>
        )}
        <button
          className="my-4 p-2 w-full bg-purple-600 text-center rounded text-white transition duration-300 ease-out hover:shadow-lg disabled:opacity-60 dark:bg-purple-700 dark:hover:bg-purple-800"
          disabled={loading}
        >
          {loading ? Spinner : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default Page;
