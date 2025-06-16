import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/config/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deviceId = params.deviceId;

    // First check if the device exists and belongs to the user
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: session.user.id,
      },
    });

    if (!device) {
      return new NextResponse("Device not found", { status: 404 });
    }

    // Delete the device
    await prisma.device.delete({
      where: {
        id: deviceId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting device:", error);
    return new NextResponse(
      "Internal Server Error", 
      { status: 500 }
    );
  }
} 