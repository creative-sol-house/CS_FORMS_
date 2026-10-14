import AdminClient from "./AdminClient";

export const metadata = {
  robots: { index: false, follow: false },
  title: "—",
};

export default function Page() {
  return <AdminClient />;
}