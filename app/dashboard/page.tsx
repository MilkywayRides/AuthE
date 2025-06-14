import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

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
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name}!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your role is: <span className="font-medium">{userRole}</span>
          </p>
        </div>

        {userRole === "USER" && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">User Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This content is visible to all users.
            </p>
          </div>
        )}

        {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Admin Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This content is only visible to administrators and super administrators.
            </p>
          </div>
        )}

        {userRole === "SUPER_ADMIN" && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Super Admin Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This content is only visible to super administrators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 