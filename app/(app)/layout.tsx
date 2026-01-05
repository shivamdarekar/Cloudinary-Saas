"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LogOut,
  Menu,
  LayoutDashboard,
  Upload,
  ImageIcon,
  Scissors,
  Settings,
  RefreshCw,
  Share2,
  CreditCard,
  X
} from "lucide-react";

const sidebarItems = [
  { href: "/home", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-500" },
  { href: "/image-compressor", icon: Settings, label: "Image Compressor", color: "text-orange-500" },
  { href: "/background-remover", icon: Scissors, label: "Background Remover", color: "text-pink-500" },
  { href: "/image-optimizer", icon: ImageIcon, label: "Image Optimizer", color: "text-green-500" },
  { href: "/social-resizer", icon: Share2, label: "Social Resizer", color: "text-blue-600" },
  { href: "/passport-maker", icon: CreditCard, label: "Passport Maker", color: "text-emerald-500" },
  { href: "/format-converter", icon: RefreshCw, label: "Format Converter", color: "text-indigo-500" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogoClick = () => {
    router.push("/home");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/home");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">ImageCraft Pro</h2>
                <p className="text-xs text-gray-500">Image Processing Suite</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${
                    isActive ? "text-white" : item.color
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Sign out button */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="lg:hidden">
                  <Link href="/home" onClick={handleLogoClick}>
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
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img
                        src={user.imageUrl}
                        alt={user.username || user.emailAddresses[0].emailAddress}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 max-w-24 truncate">
                      {user.username || user.emailAddresses[0].emailAddress.split('@')[0]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}