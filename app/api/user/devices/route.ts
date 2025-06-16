import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Log the session and prisma client for debugging
    console.log("Session user ID:", session.user.id);
    console.log("Prisma client:", prisma);

    // First, check if the Device model exists
    const deviceCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "Device"
    `;
    console.log("Device count:", deviceCount);

    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastLoginAt: 'desc',
      },
    });

    console.log("Found devices:", devices);

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Detailed error in devices API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 