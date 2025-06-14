"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    router.push("/register");
    return null;
  }

  async function onSubmit(value: string) {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure the OTP is exactly 6 digits
      if (!/^\d{6}$/.test(value)) {
        setError("Please enter a valid 6-digit code");
        toast.error("Please enter a valid 6-digit code");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: value,
        }),
      });

      const data = await response.text();

      if (!response.ok) {
        if (response.status === 400 && data === "Invalid verification code") {
          setError("The verification code you entered is incorrect. Please try again.");
          toast.error("Invalid verification code. Please try again.");
        } else if (response.status === 400 && data === "Verification code has expired") {
          setError("Your verification code has expired. Please request a new one.");
          toast.error("Verification code has expired. Please request a new one.");
        } else {
          setError(data || "Verification failed");
          toast.error(data || "Verification failed");
        }
        setIsLoading(false);
        return;
      }

      toast.success("Email verified successfully!");
      router.push("/login");
    } catch (error) {
      console.error("[VERIFY_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "Verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Auth System
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Please verify your email to complete the registration process.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verify your email
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter the verification code sent to {email}
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              onComplete={onSubmit}
              disabled={isLoading}
              containerClassName="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSeparator />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/register")}
              disabled={isLoading}
            >
              Back to Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 