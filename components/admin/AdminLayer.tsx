import { useEffect } from "react";
import { useAdminView } from "lib/adminStore";
import AdminBar from "./AdminBar";
import AdminDrawerHost from "./AdminDrawerHost";
import AdminToaster from "./AdminToaster";
import { preloadAdminChunks } from "./lazy";

/**
 * Everything the owner sees on the homepage besides the sections themselves.
 * Loaded only for a signed-in admin (pages/index.tsx imports it dynamically).
 */
const AdminLayer = () => {
  const adminView = useAdminView();

  // Fetch the sortable/toolbar chunks now, so turning the view on is instant.
  useEffect(() => {
    preloadAdminChunks();
  }, []);

  return (
    <>
      <AdminDrawerHost />
      <AdminToaster />
      {adminView && <AdminBar />}
    </>
  );
};

export default AdminLayer;
