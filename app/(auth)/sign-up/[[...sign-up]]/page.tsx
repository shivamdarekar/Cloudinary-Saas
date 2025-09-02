"use client";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg",
            formFieldInput:
              "rounded-lg border border-gray-600 bg-black text-white focus:ring-2 focus:ring-indigo-500",
            footerActionLink: "text-indigo-400 hover:underline",
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
  );
}
