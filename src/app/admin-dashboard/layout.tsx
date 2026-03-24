import { requireAdminSessionUser } from "@/app/lib/serverAuth";
import type { ReactNode } from "react";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSessionUser();
  return children;
}
