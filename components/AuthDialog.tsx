"use client";
import React, { useEffect, useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { X, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface AuthDialogProps {
  isOpen: boolean;
  mode: "signin" | "signup";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthDialog({ isOpen, mode, onClose, onSuccess }: AuthDialogProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle successful authentication
  useEffect(() => {
    if (isLoaded && user && isOpen) {
      toast.success(`Welcome ${user.firstName || 'back'}!`, { duration: 3000 });
      setAuthError(null);
      onSuccess?.();
      onClose();
    }
  }, [isLoaded, user, isOpen, onSuccess, onClose]);

  // Reset error when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[95vh] overflow-y-auto sm:max-h-[90vh] sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div>
              <h2 id="auth-dialog-title" className="text-lg sm:text-xl font-bold text-gray-900">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {mode === "signin" 
                  ? "Sign in to your ImageCraft Pro account" 
                  : "Join ImageCraft Pro today"
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error Display */}
        {authError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{authError}</p>
          </div>
        )}

        {/* Auth Component */}
        <div className="p-4 sm:p-6">
          {mode === "signin" ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent",
                  formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all",
                  formFieldInput: "rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500",
                  formFieldLabel: "text-gray-700 font-medium",
                  formHeaderTitle: "text-gray-900",
                  formHeaderSubtitle: "text-gray-600"
                },
                layout: {
                  logoPlacement: "none",
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
              routing="hash"
              afterSignInUrl={pathname}
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent",
                  formButtonPrimary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all",
                  formFieldInput: "rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg",
                  dividerLine: "bg-gray-300",
                  dividerText: "text-gray-500",
                  formFieldLabel: "text-gray-700 font-medium",
                  formHeaderTitle: "text-gray-900",
                  formHeaderSubtitle: "text-gray-600"
                },
                layout: {
                  logoPlacement: "none",
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
              routing="hash"
              afterSignUpUrl={pathname}
            />
          )}
        </div>
      </div>
    </div>
  );
}