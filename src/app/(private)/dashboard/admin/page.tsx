"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Modal from "@/components/Modal/Modal";
import { useRouter } from "next/navigation";
import { DateTime, Duration } from "luxon";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner/Spinner";
import { useToast } from "@/context/ToastContext";
import GeofenceCard from "@/components/Geofence/geofence";
import { useAuth } from "@/context/AuthContext";

interface APIResponse {
  id: string;
  code: string;
  name: string;
}

export default function Admin_dashboard() {
  const { showToast } = useToast();
  const { user, loading } = useAuth();

  const [classStarted, updateClassStarted] = useState(false);
  const [geofencesByThisAdmin, updateGeofencesByThisAdmin] = useState<
    AdminGeofence[]
  >([]);
  const [loadingActiveClasses, updateLoadingActiveClasses] = useState(false);
  const [classStartedLoading, updateClassStartedLoading] = useState(false);
  const [isTimeInputValid, updateIsTimeInputValid] = useState(false);
  const [formData, updateFormData] = useState({
    className: "",
    radius: 20,
    duration: "0:30",
    start_time: "",
  });

  const isAfter10PM = new Date().getHours() >= 22;
  const router = useRouter();

  const getGeolocation = async (): Promise<{
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
          reject(err);
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true },
      );
    });
  };

  const handleFormDataChange = (event: any) => {
    event.persist();
    const { name, value } = event.target;
    if (name === "start_time") {
      updateIsTimeInputValid(event.target.validity.valid);
    }
    updateFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const getClassesCreatedByMe = async () => {
    updateLoadingActiveClasses(true);
    const response = await api.get<AdminGeofence[]>(
      `/geofence/get_my_geofences`,
    );
    updateLoadingActiveClasses(false);

    if (response.data && response.data.length !== 0) {
      updateGeofencesByThisAdmin(response.data);
      return;
    }
    showToast("You have not created any classes yet.");
  };

  const createGeofenceHandler = async () => {
    updateClassStartedLoading(true);
    const location = await getGeolocation();

    const startTime = DateTime.fromSQL(`${formData.start_time}:00`);
    const durationHour = parseInt(formData.duration.split(":")[0]);
    const durationMin = parseInt(formData.duration.split(":")[1]);
    const duration = Duration.fromObject({
      hours: durationHour,
      minutes: durationMin,
    });
    const endTime = startTime.plus(duration).toISO();

    const response = await api.post<APIResponse>(`/geofence/create_geofence`, {
      name: formData.className,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: formData.radius,
      fence_type: "circle",
      start_time: startTime.toISO(),
      end_time: endTime,
    });

    if (response.error || !response.data) {
      showToast(
        response.error || "Failed to create class. Please try again.",
        true,
      );
      updateClassStartedLoading(false);
      return;
    }

    updateClassStartedLoading(false);
    router.push(`/dashboard/admin/class/${response.data.id}`);
  };

  async function classRecordClicked(geofence: AdminGeofence) {
    router.push(`/dashboard/admin/class/${geofence.id}`);
  }

  useEffect(() => {
    getClassesCreatedByMe();
  }, []);

  if (loading) {
    return Spinner;
  }

  return (
    <main className="min-h-screen bg-primary text-primary  w-full md:w-[800px]">
      <Modal show={classStarted} modalClosed={() => updateClassStarted(false)}>
        <div className="flex flex-col items-center justify-center w-full py-6 px-8 gap-5 bg-card text-primary">
          <h1 className="text-2xl font-bold text-center">Create Geofence.</h1>

          <p className="text-center text-secondary">
            Your class code would be generated
          </p>

          {isAfter10PM ? (
            <div className="text-center font-bold py-4 text-danger">
              New geofences cannot be created after 10:00 PM.
            </div>
          ) : (
            <form className="flex flex-col items-center w-full">
              <input
                type="text"
                name="className"
                onChange={(e) => handleFormDataChange(e)}
                className="input w-[130%] px-5"
                placeholder="Enter class name"
              />
              <select
                name="radius"
                defaultValue={20}
                onChange={(e) => handleFormDataChange(e)}
                onBlur={(e) => handleFormDataChange(e)}
                id="radius"
                className="input w-[130%]"
              >
                <option value="20">Small Classroom e.g B4 (10m)</option>
                <option value="30">Medium Classroom e.g B6 (20m)</option>
                <option value="40">Large Class e.g ELT (30m)</option>
                <option value="130">Extra-Large Hall e.g LT2 (100m)</option>
              </select>

              <label htmlFor="start_time">Input the start time:</label>
              <input
                type="time"
                name="start_time"
                id="start_time"
                min="05:00"
                max="23:30"
                className="input w-[130%]"
                onChange={(e) => handleFormDataChange(e)}
                onBlur={(e) => handleFormDataChange(e)}
              />

              {!isTimeInputValid && (
                <p className="text-sm text-danger">Enter a valid time</p>
              )}

              <select
                name="duration"
                defaultValue={30}
                onChange={(e) => handleFormDataChange(e)}
                onBlur={(e) => handleFormDataChange(e)}
                id="duration"
                className="input w-[130%]"
              >
                <option value="0:30">30 minutes</option>
                <option value="1:0">1 hour</option>
                <option value="1:30">1 hour 30 minutes</option>
                <option value="2:0">2 hours</option>
              </select>
            </form>
          )}

          {classStartedLoading ? (
            Spinner
          ) : (
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => updateClassStarted(false)}
                className="px-4 py-2 rounded-md text-white bg-purple-sec hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={createGeofenceHandler}
                disabled={!isTimeInputValid}
                className={`px-4 py-2 rounded-md text-white bg-purple-sec transition-opacity ${!isTimeInputValid ? "opacity-50 cursor-not-allowed" : "opacity-100 cursor-pointer"}`}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Page content */}
      <div className="w-full mx-auto px-4">
        {/* Top section */}
        <div className="flex flex-col items-center justify-center pt-32 gap-10 mb-6">
          <div className="flex flex-col gap-5 text-center">
            <h1 className="text-3xl font-bold">
              Hello there, <span className="text-purple">{user?.username}</span>
              .
            </h1>

            <h3>You&apos;re an admin! Don&apos;t know what to do?</h3>

            <ul className="list-disc list-inside text-left">
              <li>Start a class.</li>
              <li>Unique class code is generated.</li>
              <li>Specify geofence radius.</li>
              <li>See students attendance and end session.</li>
            </ul>
          </div>

          <Image
            src="/location_vector.svg"
            width={320}
            height={120}
            alt="location vector"
            className="hidden md:block"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-4 my-10">
          <button
            onClick={() => updateClassStarted(true)}
            className="w-full py-2 rounded text-white text-base font-medium bg-purple hover:opacity-90 transition-opacity"
          >
            Start a class.
          </button>
          <button
            onClick={() => getClassesCreatedByMe()}
            className="w-full py-2 rounded text-base font-bold text-purple-sec border-purple hover:opacity-90 transition-opacity"
          >
            Get your classes.
          </button>
        </div>

        {/* Geofence list */}
        <div className="pb-10">
          {loadingActiveClasses ? (
            <div className="flex justify-center py-10">{Spinner}</div>
          ) : geofencesByThisAdmin.length !== 0 ? (
            <div className="grid sm:grid-cols-4 gap-4">
              {geofencesByThisAdmin.map(
                (geofence: AdminGeofence, index: number) => (
                  <GeofenceCard
                    key={geofence.id}
                    index={index}
                    geofence={geofence}
                    handleGeofenceClicked={() => classRecordClicked(geofence)}
                  />
                ),
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
