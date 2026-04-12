import Image from "next/image";

interface Props {
    index: number;
    geofence: BaseGeofence;
    handleGeofenceClicked: (geofence: BaseGeofence) => void;
}

  
export default function GeofenceCard(
  {index, geofence, handleGeofenceClicked}: Props
) {
  return (
    <div
      key={index}
      onClick={() => handleGeofenceClicked(geofence)}
      className="border-2 border-purple-400 px-2 py-2 rounded-md my-2 cursor-pointer hover-effect col-span-2
                hover:scale-[102%] 
                dark:border-white"
    >
      <div id="top-geofence-card" className="flex justify-between items-center">
        <Image
          src="/classroom.svg"
          className="rounded-full dark:hidden"
          width={50}
          height={50}
          alt="class-room-vector"
        />
        <Image
          src="/class-darkmode.svg"
          className="rounded-full hidden dark:inline-block"
          width={50}
          height={50}
          alt="class-room-vector"
        />
        <span className="font-bold text-sm sm:text-base">{geofence.name}</span>
      </div>
      <div
        id="bottom-geofence-card"
        className="flex justify-between py-2 border-t-2 mt-3 dark:border-white"
      >
        <div
          id="active-status-geofence-card"
          className="flex w-full text-sm gap-2 items-center sm:text-lg"
        >
          <span
            className={`w-[10px] h-[10px] rounded-full ${
              geofence.status === "active"
                ? "bg-green-500"
                : geofence.status === "scheduled"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-nowrap text-xs sm:text-sm md:text-base">
            {geofence.status === "active"
              ? "Active"
              : geofence.status === "scheduled"
                ? "Scheduled"
                : "Inactive"}
          </span>
        </div>
        {(geofence.has_registered)  ? (
          <div>
            <span className="text-green-500 font-bold">Registered</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
