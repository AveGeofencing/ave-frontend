"use client";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "@/components/Model/Model";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner/Spinner";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
// Home is the login page
export default function Home() {
  const [isStudent, changeIsStudent] = useState(false);
  const [loginIsLoading, setLoginIsLoading] = useState(false);
  const [submitDisabled, updateSubmitDisabled] = useState(false);
  const [showDisclaimer, updateShowDisclaimer] = useState(true);

  const [formData, updateFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });

  const router = useRouter();
  const { user, loading, refetchUser } = useAuth();
  const { showToast } = useToast();

  const sendFormData = async () => {
    setLoginIsLoading(true);

    const { data, error } = await api.post<AuthResponse>(
      "/auth/login",
      {
        username: formData.email,
        password: formData.password,
      },
      { public: true, formEncoded: true },
    );
    setLoginIsLoading(false);
    updateSubmitDisabled(false);

    if (error) {
      showToast(error, true);
    }

    // Dynamically route the user based on their role
    if (data?.access_token !== undefined) {
      Cookies.set("access_token", data.access_token, { expires: 1 }); // 1 day
      await refetchUser();
      router.push(`/dashboard/${data?.role}`);
    } else {
      console.log("Login failed: No access token received.");
    }
  };

  const handleChange = (event: any) => {
    event.persist();
    const { name, value, type, checked } = event.target;

    // Take previous state and update only the input field changed.
    updateFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));

    // const submitDisabled = formData.email == "" && formData.password == "";
    let submitDisabled =
      (formData.email == "" && formData.password == "") ||
      (formData.email !== "" && formData.password == "") ||
      (formData.email == "" && formData.password !== "");
    submitDisabled =
      formData.password === "" && formData.email !== "" ? true : false;

    updateSubmitDisabled(submitDisabled);
  };

  useEffect(() => {
    const darkModeFromLocalStorage = JSON.parse(
      localStorage.getItem("darkMode") as string,
    );
    if (darkModeFromLocalStorage != undefined) {
      if (darkModeFromLocalStorage) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    } else {
      const isDarkModeOn =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDarkModeOn) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      showToast("Automatically logged in.");
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, loading]);

  return (
    <div
      id="login"
      className="w-full bg-white p-4 py-8 min-h-screen md:flex md:flex-col md:justify-center md:px-60 md:pb-16 dark:bg-gray-900"
    >
      <Modal
        show={showDisclaimer}
        modalClosed={() => updateShowDisclaimer(false)}
      >
        <div className="flex flex-col gap-4 dark:bg-gray-800 dark:text-gray-300 dark:p-4 dark:py-6 dark:rounded">
          <h1 className="text-center font-extrabold dark:text-gray-300">
            Important notice!
          </h1>
          <ul className="flex flex-col gap-2 text-sm sm:text-base">
            <li>1. This site is more optimized to mobile</li>
            <li>2. Consider switching to mobile for better accuracy</li>
          </ul>
          <button
            className="w-full py-2 px-auto bg-purple-500 text-center text-white rounded-lg hover:bg-purple-700 dark:text-gray-100 dark:bg-purple-700 dark:hover:bg-purple-800"
            onClick={() => updateShowDisclaimer(false)}
          >
            Ok
          </button>
        </div>
      </Modal>

      <div id="head" className="my-8">
        <h1 className="my-2 text-3xl font-extrabold md:text-center dark:text-gray-300">
          Login to AVE.
        </h1>
        <h1 className="text-purple-600 md:text-center">
          Enter your Login details.
        </h1>
        <div id="links" className="m-4 flex justify-around dark:text-gray-400">
          <span
            className={`border-b-2 p-2 cursor-pointer select-none ${isStudent ? "border-b-purple-500" : ""} `}
            onClick={() => changeIsStudent(true)}
          >
            Student
          </span>
          <span
            className={`border-b-2 p-2 cursor-pointer select-none ${!isStudent ? "border-b-purple-500" : ""} `}
            onClick={() => changeIsStudent(false)}
          >
            Admin (Lecturer)
          </span>
        </div>
      </div>

      <form
        action="#"
        className="flex flex-col justify-around"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          name="email"
          className="input"
          onChange={(e) => handleChange(e)}
          placeholder={`Enter ${isStudent ? "Student Email or Matric Number" : "Admin Email or ID Number"}`}
        />
        <input
          type="password"
          name="password"
          className="input"
          onChange={(e) => handleChange(e)}
          placeholder="Password"
        />

        <button
          type="submit"
          disabled={submitDisabled}
          onClick={sendFormData}
          className="my-4 p-2 w-full bg-purple-600 rounded text-white transition duration-300 ease-out hover:shadow-lg disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-800 dark:text-gray-100"
        >
          {loginIsLoading ? Spinner : "Login"}
        </button>
      </form>

      <p className="my-2 text-md dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link href={"/signup"} className="font-light underline">
          {" "}
          Sign Up
        </Link>
      </p>
      <p className="my-2 text-md dark:text-gray-400">
        Forgotten Password?{" "}
        <Link href={"/forgot-password"} className="font-light underline">
          {" "}
          Reset Password
        </Link>
      </p>
    </div>
  );
}
