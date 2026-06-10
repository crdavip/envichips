import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ShellMain } from "@/components/layout/shell-main";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? "Usuario";
  const userEmail = session.user.email ?? "";
  const userRole = (session.user as { rol?: string }).rol;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <MobileHeader userName={userName} userEmail={userEmail} userRole={userRole} />
        <Sidebar userName={userName} userEmail={userEmail} userRole={userRole} />
        <ShellMain>{children}</ShellMain>
        <BottomNav userRole={userRole} />
      </div>
    </SidebarProvider>
  );
}
