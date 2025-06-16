import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout;
  let isControllerClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial devices
        const devices = await prisma.device.findMany({
          where: { userId: session.user.id },
          orderBy: { lastLoginAt: "desc" },
        });

        if (!isControllerClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "initial", devices })}\n\n`));
        }

        // Set up polling interval
        interval = setInterval(async () => {
          if (isControllerClosed) {
            clearInterval(interval);
            return;
          }

          try {
            const updatedDevices = await prisma.device.findMany({
              where: { userId: session.user.id },
              orderBy: { lastLoginAt: "desc" },
            });

            if (!isControllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "update", devices: updatedDevices })}\n\n`));
            }
          } catch (error) {
            console.error("Error polling devices:", error);
            if (!isControllerClosed) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to fetch devices" })}\n\n`));
            }
          }
        }, 5000);
      } catch (error) {
        console.error("Error in SSE stream:", error);
        if (!isControllerClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to initialize stream" })}\n\n`));
          controller.close();
        }
      }
    },
    cancel() {
      isControllerClosed = true;
      if (interval) {
        clearInterval(interval);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
} 