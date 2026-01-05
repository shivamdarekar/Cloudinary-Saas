"use client";
import { SignUp } from "@clerk/nextjs";
import { ImageIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">Join ImageCraft Pro and start processing images</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
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
                identityPreviewText: "text-gray-600",
                formHeaderTitle: "text-gray-900",
                formHeaderSubtitle: "text-gray-600"
              },
              layout: {
                logoPlacement: "none",
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            path="/sign-up"
            routing="path"
          />
        </div>
      </div>
    </div>
  );
}