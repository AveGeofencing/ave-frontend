import Image from "next/image";

interface Props {
  index: number;
  geofence: BaseGeofence;
  handleGeofenceClicked: (geofence: BaseGeofence) => void;
}

export default function GeofenceCard({
  index,
  geofence,
  handleGeofenceClicked,
}: Props) {
  return (
    <div
      key={index}
      onClick={() => handleGeofenceClicked(geofence)}
      className="border-2 border-purple-400 px-2 py-2 rounded-md my-2 cursor-pointer hover-effect col-span-2
                hover:scale-[102%] 
                dark:border-white"
    >
      <div id="top-geofence-card" className="flex justify-between items-center">
        <svg
          height="50px"
          width="50px"
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 511.999 511.999"
          className="fill-black dark:fill-white"
        >
          <g>
            <g>
              <path
                d="M155.566,268.803h76.564c10.502,0,19.016-8.514,19.016-19.016c0-10.504-8.514-19.018-19.016-19.018H166.73l-28.767-51.561
			l27.959,31.098l0.385-24.381c0.278-17.681-13.923-32.219-31.613-32.345l-29.292-0.21c-17.699-0.127-32.121,14.223-32.073,31.931
			l0.296,108.004c0.023,8.471,3.421,16.585,9.442,22.544c4.247,4.205,9.555,7.085,15.286,8.399H58.327L31.188,186.188
			c-1.677-8.53-9.943-14.083-18.481-12.409c-8.529,1.677-14.085,9.952-12.408,18.481l29.635,150.766
			c1.45,7.382,7.922,12.705,15.445,12.705h2.711l-33.489,86.834c-2.086,5.407,0.607,11.481,6.015,13.567
			c5.397,2.083,11.478-0.599,13.567-6.015l36.401-94.386h59.778l20.559,53.31l-6.596,16.669
			c-4.638,11.719,1.104,24.977,12.823,29.614c11.711,4.635,24.974-1.095,29.614-12.823l51.8-130.902
			c2.785-7.038,1.899-14.999-2.365-21.252c-4.316-6.33-11.441-10.017-18.92-9.963l-70.228,0.206
			c-9.744-1.544-16.819-7.752-19.936-15.825c-7.178-18.589-13.397-38.331-17.731-58.726l29.578,53.012
			C142.318,265.073,148.672,268.803,155.566,268.803z M155.565,355.731L155.565,355.731c8.693,0,15.74-7.048,15.74-15.741
			c0-5.954-3.308-11.133-8.184-13.809l20.612-0.06l-21.421,54.132l-9.457-24.522H155.565z"
              />
            </g>
          </g>
          <g>
            <g>
              <circle cx="144.798" cy="97.039" r="41.972" />
            </g>
          </g>
          <g>
            <g>
              <path
                d="M416.419,268.802h76.564c10.502,0,19.016-8.514,19.016-19.016c0-10.502-8.514-19.017-19.016-19.017h-65.399
			l-28.767-51.561l27.959,31.098l0.385-24.381c0.278-17.681-13.923-32.218-31.613-32.345l-29.292-0.21
			c-17.699-0.127-32.121,14.223-32.073,31.931l0.296,108.004c0.023,8.471,3.421,16.585,9.442,22.544
			c4.247,4.205,9.555,7.085,15.286,8.399H319.18l-27.138-138.061c-1.677-8.53-9.943-14.083-18.481-12.409
			c-8.529,1.677-14.085,9.952-12.408,18.481l29.635,150.766c1.45,7.382,7.922,12.705,15.445,12.705h2.711l-33.489,86.834
			c-2.086,5.407,0.607,11.481,6.015,13.567c5.397,2.083,11.478-0.599,13.567-6.015l36.401-94.386h59.778l20.559,53.31l-6.596,16.669
			c-4.638,11.719,1.103,24.977,12.823,29.614c11.711,4.635,24.974-1.095,29.614-12.823l51.8-130.902
			c2.785-7.038,1.899-14.999-2.365-21.252c-4.316-6.33-11.441-10.017-18.92-9.963l-70.228,0.206
			c-9.744-1.544-16.819-7.752-19.936-15.825c-7.178-18.589-13.397-38.331-17.731-58.726l29.578,53.012
			C403.172,265.07,409.526,268.802,416.419,268.802z M416.419,355.731L416.419,355.731c8.693,0,15.74-7.048,15.74-15.741
			c0-5.954-3.308-11.133-8.184-13.809l20.612-0.06l-21.421,54.132l-9.457-24.522H416.419z"
              />
            </g>
          </g>
          <g>
            <g>
              <circle cx="405.654" cy="97.039" r="41.972" />
            </g>
          </g>
        </svg>
        <div className="flex flex-col text-right">
          <span className="font-bold text-lg sm:text-base">
            {geofence.name}
          </span>
          {geofence.status === "scheduled" ? (
            <span className="font-bold text-sm sm:text-base text-gray-500">
              Scheduled for {new Date(geofence.start_time).toLocaleString()}
            </span>
          ) : (
            <>
              <span className="font-bold text-sm sm:text-base text-gray-500">
                {" "}
                {new Date(geofence.start_time).toLocaleDateString()}
              </span>
              <span className="font-bold text-sm sm:text-base text-gray-500">
                {" "}
                {new Date(geofence.start_time).toLocaleTimeString()} -{" "}
                {new Date(geofence.end_time).toLocaleTimeString()}
              </span>
            </>
          )}
        </div>
      </div>
      <div
        id="bottom-geofence-card"
        className="flex justify-between py-2 border-t-2 mt-3 dark:border-white"
      >
        <div
          id="active-status-geofence-card"
          className="flex w-full text-sm gap-2 items-center sm:text-lg"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="10"
              cy="10"
              r="4"
              stroke={
                geofence.status === "inactive"
                  ? "#ef4444"
                  : geofence.status === "active"
                    ? "#22c55e"
                    : "#eab308"
              }
              strokeWidth="2"
              fill="none"
            >
              {geofence.status !== "inactive" && (
                <>
                  <animate
                    attributeName="r"
                    from="4"
                    to="9"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.7"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </circle>

            <circle
              cx="10"
              cy="10"
              r="4"
              fill={
                geofence.status === "inactive"
                  ? "#ef4444"
                  : geofence.status === "active"
                    ? "#22c55e"
                    : "#eab308"
              }
            />
          </svg>
          <span className="text-nowrap text-xs sm:text-sm md:text-base font-bold">
            {geofence.status === "active"
              ? "Active"
              : geofence.status === "scheduled"
                ? "Scheduled"
                : "Inactive"}
          </span>
        </div>
        {geofence.has_registered && (
          <div>
            <span className="text-green-500 font-bold">Registered</span>
          </div>
        )}
      </div>
    </div>
  );
}
