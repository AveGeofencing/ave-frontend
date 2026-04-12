// types.ts
interface BaseGeofence {
  id: string;
  name: string;
  radius: number;
  status: string;
  latitude: number;
  longitude: number;
  fence_type: string;
  start_time: Date;
  end_time: Date;
  has_registered?: boolean; // Add this field to indicate if the student has registered for the geofence
}

interface Geofence extends BaseGeofence {
  has_registered: boolean;
}

interface AdminGeofence extends BaseGeofence {
  fence_code: string;
}

interface GeofenceResponse {
  geofences: BaseGeofence[];
}

interface AdminGeofenceResponse {
  geofences: AdminGeofence[];
}

interface AttendanceRecord {
  user_matric: string;
  username: string;
  fence_code: string;
}