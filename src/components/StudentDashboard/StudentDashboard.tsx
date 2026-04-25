"use client";
import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import Image from "next/image";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import Spinner from "../Spinner/Spinner";
import GeofenceCard from "../Geofence/geofence";
import Rekognition from "../aws-rekognition-test/rekognition-test";
import { useAuth } from "@/context/AuthContext";

async function getGeofences() {
  const response = await api.get<GeofenceResponse>("/geofence/get_geofences");

  if (response.data && response.data.geofences) {
    return response.data.geofences;
  }
}

export default function StudentDashboard({
  geofences,
}: {
  geofences: BaseGeofence[];
}) {
  const { showToast } = useToast();
  const { user, loading } = useAuth();

  const [clientGeofences, updateGeofences] =
    useState<BaseGeofence[]>(geofences);
  const [showModal, updateShowModal] = useState(false);
  const [attendanceBeingRecorded, setAttendanceBeingRecorded] = useState(false);
  const [fenceCode, setFenceCode] = useState<string>("");
  const [gettingGeofences, setGettingGeofences] = useState(false);
  const [livenessTestStart, setLivenessTestStart] = useState<boolean>(false);
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

  async function recordAttendanceHandler(
    fenceCode: string,
    geofence: Geofence,
    sessionId: string,
  ) {
    setAttendanceBeingRecorded(true);

    const { latitude, longitude } = await getGeolocation();

    const response = await api.post("/geofence/record-attendance", {
      geofence_id: geofence.id,
      lat: latitude,
      long: longitude,
      fence_code: fenceCode,
      liveness_session_id: sessionId,
    });

    setAttendanceBeingRecorded(false);

    if (response.status !== 200) {
      showToast(
        response.error || "An error occurred while recording attendance.",
      );
      return;
    }

    if (response.status === 200) {
      showToast("Attendance recorded successfully!");
      updateSelectedGeofenceData({
        ...selectedGeofenceData,
        has_registered: true,
      });
      return;
    }
  }

  async function getGeofencesHandler() {
    setGettingGeofences(true);
    const geofences = await getGeofences();
    updateGeofences(geofences || []); // Handle case where geofences might be undefined
    setGettingGeofences(false);
    return;
  }

  const handleGeofenceClicked = (geofence: Geofence) => {
    updateShowModal(true);
    updateSelectedGeofenceData({ ...geofence });

    if (geofence.status == "inactive") {
      showToast("The selected geofence is inactive");
      return;
    }
  };

  const handleSubmitButtonClicked = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLivenessTestStart(true);
    return;
  };

  const livenessTestCompletedHandler = (sessionId: string | null) => {
    setLivenessTestStart(false);

    console.log(sessionId);
    if (!sessionId) {
      showToast("Liveness test failed");
      return;
    }

    if (sessionId) {
      showToast("Liveness test completed");
      recordAttendanceHandler(fenceCode, selectedGeofenceData, sessionId);
      return;
    }

    showToast("Could not verify liveness");
  };

  const handleModalClosed = () => {
    updateShowModal(false);
    setFenceCode("");
    setLivenessTestStart(false);
  };

  return loading ? (
    <div className="flex m-auto justify-center items-center">{Spinner}</div>
  ) : (
    <div
      id="Student-dashboard-page"
      className="p-4 flex font-body flex-col py-16 min-h-screen dark:bg-gray-900 dark:text-gray-400 w-full md:w-[800px]"
    >
      <>
        <Modal show={showModal} modalClosed={handleModalClosed}>
          {livenessTestStart ? (
            <Rekognition
              livenessTestCompletedHandler={livenessTestCompletedHandler}
            />
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full h-full py-4 px-6 gap-5 rounded">
              <h1
                className="text-2xl font-bold text-center 
            dark:text-white underline"
              >
                {selectedGeofenceData.name}
              </h1>

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
                      onClick={handleSubmitButtonClicked}
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
          )}
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

          <h3 className="text-center py-4 font-bold">
            Hello <span className="text-purple-500">{user?.username}</span>,
            join your class.
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
            md:w-full
        "
        >
          <h3 className="flex self-center border-b-2 w-full px-4 py-2 my-6 dark:border-white">
            All available classes
          </h3>

          {gettingGeofences ? (
            Spinner
          ) : clientGeofences.length !== 0 ? (
            // Grid only renders when there is data
            <div
              id="fences_list"
              className="w-full m-auto grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              {clientGeofences.map((geofence: BaseGeofence, index) => (
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
            <div className="flex flex-col gap-4 items-center justify-center min-h-[30vh] p-12">
              <img src="/sad-girl.svg" alt="no classes" className="w-64 h-64" />
              <h3 className="text-sm text-center dark:text-gray-400">
                Sorry, there are no active classes at the moment
              </h3>
            </div>
          )}
        </div>
      </>
    </div>
  );
}
