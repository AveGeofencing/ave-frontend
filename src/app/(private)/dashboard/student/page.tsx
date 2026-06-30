"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import StudentDashboard from "@/components/StudentDashboard/StudentDashboard";

export default function StudentPage() {
  const [geofences, setGeofences] = useState<BaseGeofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeofences = async () => {
      const response = await api.get<GeofenceResponse>("/geofence/get_geofences");
      if (response.data && response.data.geofences) {
        setGeofences(response.data.geofences);
        setError(null);
      } else {
        setError("Error loading geofences");
      }
      setLoading(false);
    };
    fetchGeofences();
  }, []);

  if (loading) return <div className="flex m-auto justify-center items-center">Loading...</div>;
  if (error) return <div>{error}</div>;
  return <StudentDashboard geofences={geofences} />;
}
