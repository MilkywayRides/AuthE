import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { ProfileDropdown } from "@/components/profile/profile-dropdown";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "User dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Auth System</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search or other header items here */}
            </div>
            <nav className="flex items-center">
              <ProfileDropdown />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-10">
        <div className="grid gap-6">
          <div className="p-6 bg-card rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Welcome, {session.user.name}!</h2>
            <p className="text-muted-foreground">
              Your role is: <span className="font-medium text-foreground">{userRole}</span>
            </p>
          </div>

          {userRole === "USER" && (
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">User Content</h3>
              <p className="text-muted-foreground">
                This content is visible to all users.
              </p>
            </div>
          )}

          {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Admin Content</h3>
              <p className="text-muted-foreground">
                This content is only visible to administrators and super administrators.
              </p>
            </div>
          )}

          {userRole === "SUPER_ADMIN" && (
            <div className="p-6 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Super Admin Content</h3>
              <p className="text-muted-foreground">
                This content is only visible to super administrators.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 