import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Implement actual password reset logic with backend
    toast.success("If an account exists with this email, you will receive a password reset link.");
    setSubmitted(true);
    
    // Simulate sending email
    setTimeout(() => {
      // In a real implementation, this would trigger an email with a reset token
      console.log("Password reset email would be sent to:", email);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-2 border-black dark:border-white sketch-shadow">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
            <CardDescription>
              {submitted 
                ? "Check your email for a reset link" 
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-2 border-black dark:border-white pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full border-2 border-black dark:border-white sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
                >
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    If an account exists with <strong>{email}</strong>, you will receive a password reset email shortly.
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't receive an email? Check your spam folder or try again.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="w-full border-2 border-black dark:border-white"
                >
                  Try Different Email
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation("/login")}
                className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                style={{ color: "var(--sketch-blue)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
