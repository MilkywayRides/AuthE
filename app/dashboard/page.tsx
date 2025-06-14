import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { ProfileDropdown } from "@/components/profile/profile-dropdown";
import { ROLES } from "@/constants";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Auth System</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <ProfileDropdown user={session.user} />
          </div>
        </div>
      </header>
      <main className="container py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name || "User"}!
            </p>
          </div>
          <div className="grid gap-4">
            {session.user.role === ROLES.USER && (
              <div className="rounded-lg border p-4">
                <h2 className="text-xl font-semibold">User Content</h2>
                <p className="text-muted-foreground">
                  This content is only visible to regular users.
                </p>
              </div>
            )}
            {(session.user.role === ROLES.ADMIN || session.user.role === ROLES.SUPER_ADMIN) && (
              <div className="rounded-lg border p-4">
                <h2 className="text-xl font-semibold">Admin Content</h2>
                <p className="text-muted-foreground">
                  This content is only visible to administrators.
                </p>
              </div>
            )}
            {session.user.role === ROLES.SUPER_ADMIN && (
              <div className="rounded-lg border p-4">
                <h2 className="text-xl font-semibold">Super Admin Content</h2>
                <p className="text-muted-foreground">
                  This content is only visible to super administrators.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 