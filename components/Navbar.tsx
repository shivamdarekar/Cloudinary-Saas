"use client";
import React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Menu, ImageIcon } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useUser();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 border border-gray-300"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div className="md:hidden">
              <Link href="/home">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">ImageCraft Pro</span>
                </div>
              </Link>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {user.firstName?.charAt(0).toUpperCase() || user.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}