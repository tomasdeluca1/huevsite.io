import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: "Admin — huevsite.io",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side gate. If the visitor isn't the admin, this throws a
  // redirect and `children` never render. Every admin page and its
  // subtree rely on this — they don't re-check auth client-side.
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--bg)] font-display">
      <AdminSidebar />
      <main className="md:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 md:px-10 md:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
