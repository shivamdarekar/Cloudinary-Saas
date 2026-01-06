import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {ClerkProvider} from '@clerk/nextjs'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImageCraft Pro - AI-Powered Image Processing",
  description: "Professional image processing tools: compress, optimize, remove backgrounds, create passport photos, and more. Powered by AI.",
  keywords: ["image processing", "AI tools", "image compression", "background remover", "passport photo maker"],
  authors: [{ name: "ImageCraft Pro" }],
  icons: {
    icon: '/imagecraft-logo.png',
    shortcut: '/imagecraft-logo.png',
    apple: '/imagecraft-logo.png',
  },
  openGraph: {
    title: "ImageCraft Pro",
    description: "AI-Powered Image Processing Suite",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          duration={4000}
          closeButton
        />
      </body>
    </html>
    </ClerkProvider>
  );
}