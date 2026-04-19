import React from "react";
import { api } from "@/lib/api";
import StudentDashboard from "@/components/StudentDashboard/StudentDashboard";

const Page = async () => {
  const geofences = await api.get<GeofenceResponse>("/geofence/get_geofences");

  if (!geofences.data) {
    return <div>Error loading geofences</div>;
  }

  return <StudentDashboard geofences={geofences.data?.geofences} />;
};

export default Page;
