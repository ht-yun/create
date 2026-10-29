import { AppShell } from "@/components/app-shell";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata = { title: "管理后台" };

export default function AdminPage() {
  return <AppShell active="admin"><AdminDashboard /></AppShell>;
}
