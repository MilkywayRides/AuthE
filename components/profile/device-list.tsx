"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Laptop, Smartphone, Tablet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Device {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastLoginAt: string;
}

export function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const setupSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource("/api/user/devices/events");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "initial" || data.type === "update") {
            setDevices(data.devices);
            setLoading(false);
            setError(null);
          } else if (data.type === "error") {
            setError(data.message);
            setLoading(false);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
          setError("Failed to parse device data");
          setLoading(false);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        if (eventSource) {
          eventSource.close();
        }
        setError("Connection lost. Reconnecting...");
        // Try to reconnect after a delay
        reconnectTimeout = setTimeout(setupSSE, 5000);
      };
    };

    setupSSE();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const handleLogout = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/user/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (response.status === 404) {
        // Device not found - it might have been deleted already
        setDevices(devices.filter(device => device.id !== deviceId));
        toast.success("Device logged out successfully");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to logout device");
      }

      // If this is the current device, sign out the user
      if (deviceId === session?.user?.id) {
        await signOut({ redirect: true, callbackUrl: "/login" });
      } else {
        // Otherwise, just remove the device from the list
        setDevices(devices.filter(device => device.id !== deviceId));
        toast.success("Device logged out successfully");
      }
    } catch (err) {
      console.error("Error logging out device:", err);
      toast.error(err instanceof Error ? err.message : "Failed to logout device");
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      return <Smartphone className="h-4 w-4" />;
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getDeviceType = (userAgent: string): string => {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      return "Mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "Tablet";
    }
    return "Desktop";
  };

  const getBrowserInfo = (userAgent: string): string => {
    if (/Chrome/i.test(userAgent)) return "Chrome";
    if (/Firefox/i.test(userAgent)) return "Firefox";
    if (/Safari/i.test(userAgent)) return "Safari";
    if (/Edge/i.test(userAgent)) return "Edge";
    if (/Opera|OPR/i.test(userAgent)) return "Opera";
    return "Unknown Browser";
  };

  const getOSInfo = (userAgent: string): string => {
    if (/Windows/i.test(userAgent)) return "Windows";
    if (/Mac/i.test(userAgent)) return "macOS";
    if (/Linux/i.test(userAgent)) return "Linux";
    if (/Android/i.test(userAgent)) return "Android";
    if (/iOS/i.test(userAgent)) return "iOS";
    return "Unknown OS";
  };

  if (loading) {
    return <div>Loading devices...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-50 p-4 rounded-md">
        <p className="font-medium">Error: {error}</p>
        <p className="text-sm mt-1">The device list will automatically reconnect.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logged-in Devices</CardTitle>
        <CardDescription>
          View and manage devices that have accessed your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Operating System</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="flex items-center gap-2">
                  {getDeviceIcon(device.userAgent)}
                  {getDeviceType(device.userAgent)}
                </TableCell>
                <TableCell>{getBrowserInfo(device.userAgent)}</TableCell>
                <TableCell>{getOSInfo(device.userAgent)}</TableCell>
                <TableCell>{device.ipAddress}</TableCell>
                <TableCell>
                  {format(new Date(device.lastLoginAt), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Logout from this device?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out from this device. You'll need to log in again to access your account from this device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleLogout(device.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Logout
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 