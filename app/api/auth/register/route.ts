import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists and is verified
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // If user exists but is not verified, delete the old record
    if (existingUser) {
      await prisma.user.delete({
        where: {
          email,
        },
      });
    }

    const hashedPassword = await hash(password, 12);
    const otp = generateOTP();

    // Create user first
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        resetToken: otp,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
      },
    });

    // Send verification email with OTP
    if (!process.env.RESEND_API_KEY) {
      console.error("[EMAIL_ERROR] RESEND_API_KEY is not configured");
      // Delete the user since email sending failed
      await prisma.user.delete({
        where: {
          email,
        },
      });
      return NextResponse.json(
        { message: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    try {
      const { error } = await resend.emails.send({
        from: "Auth System <devambienceweb@gmail.com>",
        to: "devambienceweb@gmail.com", // Send to verified email
        subject: "Verify your email",
        html: `
          <h1>Welcome to Auth System!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for registering with Auth System. Please use the following code to verify your email:</p>
          <h2 style="font-size: 24px; letter-spacing: 2px; text-align: center; padding: 10px; background: #f4f4f4; border-radius: 4px;">${otp}</h2>
          <p>This code will expire in 10 minutes.</p>
          <p>Note: This is a test email. In production, this would be sent to ${email}.</p>
        `,
      });

      if (error) {
        console.error("[EMAIL_ERROR]", error);
        // Delete the user since email sending failed
        await prisma.user.delete({
          where: {
            email,
          },
        });
        return NextResponse.json(
          { message: "Failed to send verification email. Please try again." },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error("[EMAIL_ERROR]", emailError);
      // Delete the user since email sending failed
      await prisma.user.delete({
        where: {
          email,
        },
      });
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 