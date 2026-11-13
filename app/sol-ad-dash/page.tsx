import { Suspense } from "react";
import AdminClient from "./AdminClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "—",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#fafaf9] text-black">Loading dashboard...</div>}>
      <AdminClient />
    </Suspense>
  );
}