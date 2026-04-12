"use client";
import React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/Model/Model";
import { api } from "@/lib/api";
import GeofenceCard from "@/components/Geofence/geofence";
import { useToast } from "@/context/ToastContext";
import Spinner from "@/components/Spinner/Spinner";
import { useAuth } from "@/context/AuthContext";

async function getGeofences() {
  const response = await api.get<GeofenceResponse>("/geofence/get_geofences");

  if (response.data && response.data.geofences) {
    return response.data.geofences;
  }
}

async function recordAttendance(
  geofenceId: string,
  fenceCode: string,
  latitude: number,
  longitude: number,
) {
  const res = await api.post("/geofence/record-attendance", {
    geofence_id: geofenceId,
    lat: latitude,
    long: longitude,
    fence_code: fenceCode,
  });
  return res;
}

const Page = () => {
  const [loading, updateLoading] = useState(true);

  const [networkError, updateNetworkError] = useState(false);
  const [attendanceBeingRecorded, setAttendanceBeingRecorded] = useState(false);
  const [confirmationError, updateConfirmationError] = useState({
    state: false,
    message: "",
  });
  const [geofences, updateGeofences] = useState<BaseGeofence[]>([]);
  const [selectedGeofenceData, updateSelectedGeofenceData] = useState<Geofence>(
    {
      id: "",
      name: "",
      radius: 0,
      status: "",
      latitude: 0,
      longitude: 0,
      fence_type: "",
      start_time: new Date(),
      end_time: new Date(),
      has_registered: false,
    },
  );
  const [showModal, updateShowModal] = useState(false);
  const [fenceCode, setFenceCode] = useState<string>("");
  const { showToast } = useToast();
  const { user } = useAuth();

  const getGeolocation = (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    showToast("Retrieving your location...");

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          let message = "Unable to retrieve your location.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message =
                "Location access denied. Please allow location access and try again.";
              break;
            case err.POSITION_UNAVAILABLE:
              message =
                "Location information is unavailable. Please try again.";
              break;
            case err.TIMEOUT:
              message = "Location request timed out. Please try again.";
              break;
          }

          showToast(message);
          setAttendanceBeingRecorded(false);
          reject(err);
        },
        {
          timeout: 10000, // 10 seconds — throws TIMEOUT error if exceeded
          maximumAge: 0, // don't use a cached position
          enableHighAccuracy: true, // use GPS if available
        },
      );
    });
  };

  async function getGeofencesHandler() {
    updateLoading(true);
    const geofences = await getGeofences();
    updateGeofences(geofences || []); // Handle case where geofences might be undefined
    updateLoading(false);
  }

  async function recordAttendanceHandler(
    fenceCode: string,
    geofence: Geofence,
  ) {
    setAttendanceBeingRecorded(true);

    const { latitude, longitude } = await getGeolocation();

    const response = await recordAttendance(
      geofence.id,
      fenceCode,
      latitude,
      longitude,
    );

    setAttendanceBeingRecorded(false);

    if (response.status !== 200) {
      updateConfirmationError({
        state: true,
        message:
          response.error || "An error occurred while recording attendance.",
      });
    }

    showToast(
      response.status === 200
        ? "Attendance recorded successfully!"
        : response.error || "An error occurred while recording attendance.",
    );
  }

  const handleGeofenceClicked = (geofence: Geofence) => {
    updateShowModal(true);
    updateSelectedGeofenceData({ ...geofence });

    if (geofence.status == "inactive") {
      updateConfirmationError({
        state: true,
        message: "The geofence you have selected is currently inactive",
      });
      return;
    }
  };

  // Load geofences upon entry to page.
  useEffect(() => {
    getGeofencesHandler();
  }, []);

  return (
    <div
      id="Student-dashboard-page"
      className="p-4 flex font-body flex-col py-16 min-h-screen dark:bg-gray-900 dark:text-gray-400"
    >
      <Modal show={showModal} modalClosed={() => updateShowModal(false)}>
        <div className="relative flex flex-col items-center justify-center w-full h-full py-4 px-6 gap-5 rounded">
          <button
            className="absolute top-0 right-2 hover:cursor-pointer"
            onClick={(e) => {
              updateConfirmationError({ state: false, message: "" });
              updateShowModal(false);
              setFenceCode("");
            }}
            disabled={attendanceBeingRecorded}
          >
            X
          </button>
          <h1
            className="
            text-2xl font-bold text-center 
            dark:text-white
          "
          >
            Enter the class fence code.
          </h1>

          {!selectedGeofenceData.has_registered ? (
            <div>
              <form
                action=""
                className="flex flex-col items-center justify-center"
              >
                <input
                  type="name"
                  name="fenceCode"
                  id="fence_code"
                  value={fenceCode}
                  onChange={(e) => setFenceCode(e.target.value)} // Set fence code value
                  className="input w-[130%] px-5"
                  maxLength={6}
                  placeholder={`Enter fence code`}
                />
              </form>
              <div className="flex flex-row gap-2 justify-center items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    recordAttendanceHandler(fenceCode, selectedGeofenceData);
                  }}
                  className="
                  bg-green-700 text-white p-2 w-24 rounded-lg
                  hover:bg-green-500 transition ease-out duration-300
                  disabled:bg-gray-400 disabled:border-gray-400 disabled:text-gray-700
                  "
                  disabled={attendanceBeingRecorded || fenceCode.length < 6} // Disable button while processing
                >
                  {attendanceBeingRecorded ? Spinner : "Confirm"}
                </button>
              </div>
            </div>
          ) : (
            <h1 className="text-center text-green-500 font-bold">
              You have already recorded attendance for this class session.
            </h1>
          )}
        </div>
      </Modal>

      <div className="flex flex-col items-center justify-center">
        <Image
          src="/students.svg"
          alt="students svg"
          width={200}
          height={200}
          className="pt-4 self-center"
        />

        <h1 className="text-center text-4xl text-[#313131] font-playwrite py-2 font-extrabold dark:text-gray-300">
          Student Dashboard
        </h1>

        <h3 className="text-center py-4">
          Hello <span className="text-purple-500">{user?.username}</span>, join
          your class.
        </h3>

        <div className="flex flex-col justify-center align-center w-full md:w-[50%] self-center">
          <button
            onClick={getGeofencesHandler}
            className="py-2 px-6 w-full text white border border-white my-3 rounded-lg text-white bg-purple-500
          transition ease-out duration-300 hover:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:border-0 dark:text-gray-200"
          >
            Refresh List
          </button>
        </div>
      </div>

      <div
        className="
        flex flex-col justify-center items-center w-full 
        dark:text-white self-center 
        md:w-[50%]
      "
      >
        <h3 className="flex self-center border-b-2 w-full px-4 py-2 my-6 dark:border-white">
          All available classes
        </h3>

        {loading ? (
          Spinner
        ) : geofences.length !== 0 ? (
          // Grid only renders when there is data
          <div
            id="fences_list"
            className="w-full m-auto grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {geofences.map((geofence: BaseGeofence, index) => (
              <GeofenceCard
                key={index}
                index={index}
                geofence={geofence}
                handleGeofenceClicked={() => {
                  handleGeofenceClicked(geofence as Geofence);
                }}
              />
            ))}
          </div>
        ) : (
          // Empty state is fully outside the grid — takes full width and centers properly
          <div className="flex flex-col gap-4 items-center justify-center min-h-[30vh] p-12">
            <img src="/sad-girl.svg" alt="no classes" className="w-64 h-64" />
            {networkError ? (
              <h3 className="font-bold text-red-500 text-sm text-center">
                There was a network error. <br /> Check your connection and try
                again.
              </h3>
            ) : (
              <h3 className="text-sm text-center dark:text-gray-400">
                Sorry, there are no active classes at the moment
              </h3>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
