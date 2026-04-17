import ClassPage from "@/components/ClassPage/ClassPage";

export default async function ClassPageWrapper({
  params,
}: {
  params: Promise<{ geofenceId: string }>;
}) {
  const { geofenceId } = await params;

  if (!geofenceId) {
    return <div>Missing geofence ID</div>;
  }

  return <ClassPage fenceId={geofenceId} />;
}
