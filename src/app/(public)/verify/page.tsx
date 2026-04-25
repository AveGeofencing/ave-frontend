"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

// --- Types ---
interface RegisterData {
  username: string;
  user_matric: string;
  password: string;
  role: string;
  department: number | null;
}

interface DepartmentData {
  id: number;
  name: string;
}

interface CollegeData {
  id: number;
  name: string;
  departments: DepartmentData[];
}

// --- Component ---
function VerifyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [listOfColleges, setListOfColleges] = useState<CollegeData[]>([]);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, updateVerificationStatus] = useState<
    "success" | "idle" | "error"
  >("idle");

  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    user_matric: "",
    password: "",
    role: "",
    department: null,
  });

  // College/department selection (UI state only, not sent to backend)
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(
    null,
  );

  // --- Photo state ---
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const availableDepartments =
    listOfColleges.find((c) => c.id === selectedCollegeId)?.departments ?? [];

  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collegeId = Number(e.target.value);
    setSelectedCollegeId(collegeId || null);
    // Reset department when college changes
    setFormData((prev) => ({ ...prev, department: null }));
  };

  const isFormValid =
    formData.username.trim() !== "" &&
    formData.user_matric.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.role !== "" &&
    formData.department !== null &&
    photoFile !== null;

  // --- Camera helpers ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Attach stream after state update causes re-render + video mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch {
      showToast("Could not access camera. Please upload a photo instead.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      showToast("Camera isn't ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      stopCamera();
    }, "image/jpeg");
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // --- Verification ---
  async function handleVerification(token: string) {
    updateVerificationStatus("idle");
    setLoading(true);
    const res = await api.post<null>(
      `/auth/verify-email?token=${token}`,
      {},
      { public: true },
    );

    // Bad path
    if (res.error) {
      setIsTokenVerified(false);
      updateVerificationStatus("error");
      showToast(res.error, true);
      return;
    }

    // Happy path
    setIsTokenVerified(true);
    updateVerificationStatus("success");
    setLoading(false);
  }

  // --- Submit ---
  const handleSubmit = async () => {
    if (!photoFile || formData.department === null) {
      showToast("Please complete all required fields");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();
      body.append("username", formData.username);
      body.append("user_matric", formData.user_matric);
      body.append("password", formData.password);
      body.append("role", formData.role);
      body.append("department_id", String(formData.department));
      body.append("photo_ref_upload", photoFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/create-user`,
        {
          method: "POST",
          credentials: "include",
          body,
        },
      );

      if (!res.ok) {
        const error: { detail: string | { msg: string }[] } = await res.json();
        const message = Array.isArray(error.detail)
          ? error.detail.map((e) => e.msg).join(", ")
          : error.detail;
        showToast(message);
        return;
      }

      showToast("Account created successfully. Redirecting...");
      router.push("/login");
    } catch {
      showToast("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      updateVerificationStatus("error");
      return;
    }
    handleVerification(token);
  }, [token]);

  // get the list of colleges and their departments.
  useEffect(() => {
    const getColleges = async () => {
      const response = await api.get<CollegeData[]>("/user/colleges");
      if (response.status == 200 && response.data) {
        setListOfColleges(response.data);
      }
    };

    getColleges();
  }, []);

  // Attach stream to video element once it's in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), []);

  return (
    <div className="min-h-screen max-w-screen px-6 sm:p-8 py-12 md:flex md:justify-center md:items-center dark:bg-gray-900">
      <div className="flex flex-col items-center md:border md:rounded-xl md:p-8 md:min-w-[500px]">
        {/* Mail SVG div at the top */}
        <div className="rounded-full p-4 bg-purple-100 block w-fit dark:bg-purple-800">
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

        <div className="flex flex-col justify-center items-center w-full">
          <div className="py-4 text-center">
            <h1 className="text-2xl text-purple-900 text-center font-bold">
              {verificationStatus === "error"
                ? isTokenVerified
                  ? "Complete your profile"
                  : "Link has expired"
                : "Verifying link..."}
            </h1>
          </div>

          {isTokenVerified && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col">
                <label htmlFor="" className="font-semibold">
                  First name and last name
                </label>
                <input
                  type="text"
                  className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2"
                  placeholder="Full name"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="" className="font-semibold">
                  Matric Number or Staff number
                </label>
                <input
                  type="text"
                  className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2"
                  placeholder="Matric Number"
                  value={formData.user_matric}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_matric: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="" className="font-semibold">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2"
                >
                  <option value="" disabled>
                    Select a role
                  </option>
                  <option value="student">Student</option>
                  <option value="admin">Lecturer</option>
                </select>
              </div>

              <div className="flex flex-col">
                {/* College selector — UI only */}
                <label htmlFor="" className="font-semibold">
                  College
                </label>

                <select
                  value={selectedCollegeId ?? ""}
                  onChange={handleCollegeChange}
                  className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2"
                >
                  <option value="" disabled>
                    Select a college
                  </option>
                  {listOfColleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                {/* Department selector — sends department_id to backend */}
                <label htmlFor="" className="font-semibold">
                  Department
                </label>

                <select
                  value={formData.department ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: Number(e.target.value),
                    }))
                  }
                  disabled={selectedCollegeId === null}
                  className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {selectedCollegeId === null
                      ? "Select a college first"
                      : "Select a department"}
                  </option>
                  {availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="" className="font-semibold">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="border rounded-lg h-12 border-[var(--color-input-border)] focus:outline-[var(--color-purple-primary)] p-2 w-full"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Photo capture section */}
              <div className="border rounded-lg border-[var(--color-input-border)] p-3 flex flex-col gap-3">
                <p className="text-sm font-medium text-purple-900">
                  Profile Photo <span className="text-red-500">*</span>
                </p>

                {cameraActive && (
                  <div className="flex flex-col gap-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-lg bg-black -scale-x-100"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-2 px-3 bg-purple-500 text-white rounded-lg text-sm font-semibold"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2 px-3 border border-purple-900 text-purple-900 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!cameraActive && photoPreview && (
                  <div className="flex flex-col gap-2">
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full mx-auto border-2 border-purple-300"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="text-sm text-red-500 underline text-center"
                    >
                      Remove photo
                    </button>
                  </div>
                )}

                {!cameraActive && !photoPreview && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-2 px-3 bg-purple-500 text-white rounded-lg text-sm font-semibold"
                    >
                      Take Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading &&
            verificationStatus !== "idle" &&
            (verificationStatus === "error" ? (
              <p className="text-red-500 font-semibold text-center py-4 pt-6">
                This link could not be verified. It is either expired or
                invalid.
              </p>
            ) : (
              <p className="text-green-500 font-bold text-center py-4 pt-6">
                Your email has been successfully verified.
              </p>
            ))}

          {isTokenVerified && (
            <button
              className="py-3 px-4 w-full text-center font-semibold bg-purple-500 cursor-pointer text-white rounded-lg my-4 disabled:opacity-50 dark:bg-purple-700 dark:text-gray-300"
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : "Submit details"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  );
}
