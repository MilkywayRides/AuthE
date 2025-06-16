import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";

interface ExtendedCredentials {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

// Helper function to get device info
function getDeviceInfo(req: any) {
  const forwardedFor = req?.headers?.["x-forwarded-for"];
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : req?.headers?.["x-real-ip"];
  const userAgent = req?.headers?.["user-agent"] || "Unknown Browser";

  // For local development, provide more meaningful information
  if (process.env.NODE_ENV === "development") {
    return {
      ipAddress: "Local Development",
      userAgent: userAgent,
      deviceType: getDeviceType(userAgent),
      browser: getBrowserInfo(userAgent),
      os: getOSInfo(userAgent)
    };
  }

  return {
    ipAddress: ipAddress || "Unknown IP",
    userAgent: userAgent,
    deviceType: getDeviceType(userAgent),
    browser: getBrowserInfo(userAgent),
    os: getOSInfo(userAgent)
  };
}

// Helper function to determine device type
function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    return "Mobile";
  } else if (/Tablet|iPad/i.test(userAgent)) {
    return "Tablet";
  }
  return "Desktop";
}

// Helper function to get browser info
function getBrowserInfo(userAgent: string): string {
  if (/Chrome/i.test(userAgent)) return "Chrome";
  if (/Firefox/i.test(userAgent)) return "Firefox";
  if (/Safari/i.test(userAgent)) return "Safari";
  if (/Edge/i.test(userAgent)) return "Edge";
  if (/Opera|OPR/i.test(userAgent)) return "Opera";
  return "Unknown Browser";
}

// Helper function to get OS info
function getOSInfo(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iOS/i.test(userAgent)) return "iOS";
  return "Unknown OS";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        const headersList = headers();
        const userAgent = headersList.get("user-agent") || "Unknown Browser";
        const ipAddress = headersList.get("x-forwarded-for") || 
                         headersList.get("x-real-ip") || 
                         "127.0.0.1";

        // Create or update device record
        await prisma.device.upsert({
          where: {
            userId_userAgent: {
              userId: user.id,
              userAgent: userAgent,
            },
          },
          create: {
            userId: user.id,
            ipAddress: ipAddress,
            userAgent: userAgent,
            lastLoginAt: new Date(),
          },
          update: {
            ipAddress: ipAddress,
            lastLoginAt: new Date(),
          },
        });

        // Update user's last IP address
        await prisma.user.update({
          where: { id: user.id },
          data: { lastIpAddress: ipAddress },
        });

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign in even if device tracking fails
      }
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      try {
        const headersList = headers();
        const userAgent = headersList.get("user-agent") || "Unknown Browser";
        const ipAddress = headersList.get("x-forwarded-for") || 
                         headersList.get("x-real-ip") || 
                         "127.0.0.1";

        // Create or update device record
        await prisma.device.upsert({
          where: {
            userId_userAgent: {
              userId: user.id,
              userAgent: userAgent,
            },
          },
          create: {
            userId: user.id,
            ipAddress: ipAddress,
            userAgent: userAgent,
            lastLoginAt: new Date(),
          },
          update: {
            ipAddress: ipAddress,
            lastLoginAt: new Date(),
          },
        });

        // Update user's last IP address
        await prisma.user.update({
          where: { id: user.id },
          data: { lastIpAddress: ipAddress },
        });
      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions); 