"use client";
import React from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { Menu, ImageIcon, LogOut } from "lucide-react";
import AuthDialog from "./AuthDialog";
import { useAuthDialog } from "../lib/useAuthDialog";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isOpen, mode, openSignIn, openSignUp, close } = useAuthDialog();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 border border-gray-300"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <div className="md:hidden">
              <Link href="/home">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">ImageCraft Pro</span>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                  {user.firstName?.charAt(0).toUpperCase() || user.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => signOut({ redirectUrl: "/home" })}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={openSignIn}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors text-xs sm:text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all text-xs sm:text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AuthDialog
        isOpen={isOpen}
        mode={mode}
        onClose={close}
      />
    </header>
  );
}