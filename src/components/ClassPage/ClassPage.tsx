"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Spinner from "@/components/Spinner/Spinner";

const downloadCSV = (classData: AdminGeofence | null) => {
  const table: any = document.getElementById("classAttendanceTable");
  if (!table) return;

  const rows = table.querySelectorAll("tr");
  let csvContent = "";

  rows.forEach((row: any) => {
    const cells = row.querySelectorAll("th, td");
    const rowContent = Array.from(cells)
      .map((cell: any) => `"${cell.innerText}"`)
      .join(",");
    csvContent += rowContent + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${classData?.name ?? "attendance"}-attendance.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export default function ClassPage({ fenceId }: { fenceId: string }) {
  const [classData, updateClassData] = useState<AdminGeofence | null>(null);
  const [attendanceList, updateAttendanceList] = useState<AttendanceRecord[]>(
    [],
  );
  const [refreshListLoading, updateRefreshListLoading] = useState(false);
  const [endClassLoading, updateEndClassLoading] = useState(false);

  const { showToast } = useToast();
  const divRef = useRef<HTMLDivElement | null>(null);

  const getGeofence = async () => {
    const response = await api.get<AdminGeofence>(`/geofence/${fenceId}`);

    if (!response.data) {
      showToast("Error fetching geofence data");
      return;
    }

    updateClassData(response.data);
  };

  const getAttendanceHandler = async () => {
    updateRefreshListLoading(true);

    const response = await api.get<AttendanceRecord[]>(
      `/geofence/get_attendances?fence_id=${fenceId}`,
    );

    if (!response.data) {
      showToast("Error fetching attendance records.", true);
      updateRefreshListLoading(false);
      return;
    }

    if (response.data.length === 0) {
      showToast("No attendance records found.");
      updateAttendanceList([]);
      updateRefreshListLoading(false);
      return;
    }

    updateAttendanceList(response.data);
    updateRefreshListLoading(false);
  };

  const endClassHandler = async () => {
    updateEndClassLoading(true);

    const response = await api.put(
      `/geofence/deactivate?geofence_id=${fenceId}`,
    );

    if (response.error) {
      showToast("Error ending class.", true);
      updateEndClassLoading(false);
      return;
    }

    await getGeofence();
    updateEndClassLoading(false);
    showToast("Class ended.");
  };

  useEffect(() => {
    const init = async () => {
      await getGeofence();
      await getAttendanceHandler();
    };

    init();
  }, [fenceId]);

  if (!classData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {Spinner}
      </div>
    );
  }

  return (
    <div className="flex px-6 pt-20 flex-col gap-4 min-h-screen dark:bg-gray-900 dark:text-gray-400">
      <h1 className="text-4xl font-extrabold text-center dark:text-gray-300">
        {classData.name}
      </h1>

      <h2 className="text-xl text-gray-500 text-center">
        Your class code is{" "}
        <span className="font-bold">{classData.fence_code}</span>
        <br />
        <span className="text-sm sm:text-base">
          (Share this code with all students of this class)
        </span>
      </h2>

      <div id="classAttendance">
        <button
          onClick={getAttendanceHandler}
          className="py-2 px-6 w-full border border-white my-3 rounded text-white bg-purple-500
          transition ease-out duration-300 hover:bg-purple-800 dark:bg-purple-700 dark:hover:bg-purple-800 dark:text-gray-200 dark:border-gray-400"
        >
          Refresh List
        </button>

        <div className="flex justify-between">
          <button
            onClick={endClassHandler}
            className="py-2 px-6 w-[90%] border border-purple-500 my-3 bg-white transition ease-out duration-300 hover:bg-red-600
            hover:text-white disabled:bg-red-500 disabled:opacity-75 disabled:text-white dark:bg-red-600 dark:text-gray-100 dark:hover:bg-red-700"
            disabled={classData.status !== "active"}
          >
            {endClassLoading
              ? Spinner
              : classData.status === "active"
                ? "End Class"
                : "Class is inactive"}
          </button>

          <button
            className="px-4 border border-purple-500 scale-[65%]"
            title="Download Attendance"
            onClick={() => downloadCSV(classData)}
          >
            <Image
              src="/download-svg.svg"
              className="dark:hidden"
              width={30}
              height={3}
              alt="Download Image"
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="hidden size-8 dark:inline-block"
              fill="#11111"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
              />
            </svg>
          </button>
        </div>

        <header className="text-lg py-4 pb-0 text-purple-500 font-bold text-center">
          ATTENDANCE LIST FOR THE CLASS
        </header>

        <p className="text-center py-2 pb-4">(Refresh to see updated list)</p>

        {refreshListLoading ? (
          <div className="flex justify-center py-6" ref={divRef}>
            {Spinner}
          </div>
        ) : (
          <table
            id="classAttendanceTable"
            className="table-auto w-full text-left border-collapse"
          >
            <thead>
              <tr>
                <th className="border px-4 py-2 w-[8%]">S/N</th>
                <th className="border px-4 py-2 w-[60%]">Name</th>
                <th className="border px-4 py-2">Matric No.</th>
                <th className="border px-4 py-2">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((student, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{student.username}</td>
                    <td className="border px-4 py-2">{student.user_matric}</td>
                    <td className="border px-4 py-2">{student.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    No attendance records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
