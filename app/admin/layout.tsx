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
    <div className="min-h-screen bg-[var(--bg)] font-display flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 pt-20 md:p-10 md:pt-10 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
