import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;

  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Welcome, {session.user.name}!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            You have access to the admin dashboard.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Admin Controls</h3>
          <p className="text-gray-600 dark:text-gray-300">
            This section contains administrative controls and settings.
          </p>
        </div>
      </div>
    </div>
  );
} 