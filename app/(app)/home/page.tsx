"use client";
import React from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ImageIcon, Zap, Shield, Download, ArrowRight, Share2, CreditCard, Tag } from "lucide-react";

function Home() {
  const { user } = useUser();

  const features = [
    {
      icon: Zap,
      title: "Image Compressor",
      description: "Compress images to your desired size in KB with advanced AI algorithms",
      href: "/image-compressor",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Shield,
      title: "Background Remover",
      description: "Remove backgrounds from images instantly using AI-powered technology",
      href: "/background-remover",
      color: "from-pink-500 to-purple-500"
    },
    {
      icon: ImageIcon,
      title: "Image Optimizer",
      description: "Optimize images for web and mobile with custom dimensions and quality",
      href: "/image-optimizer",
      color: "from-green-500 to-blue-500"
    },
    {
      icon: Share2,
      title: "Social Resizer",
      description: "Resize images for perfect social media posts - Facebook, Instagram, LinkedIn",
      href: "/social-resizer",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: CreditCard,
      title: "Passport Maker",
      description: "Create perfect passport & ID photos for official documents",
      href: "/passport-maker",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: Tag,
      title: "Auto Tagger",
      description: "Generate AI-powered tags and metadata for your images automatically",
      href: "/auto-tagger",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ImageIcon className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 text-gray-900">
              Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ImageCraft Pro</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              Your all-in-one AI-powered image processing suite. Transform, optimize, and enhance your images with cutting-edge technology. Upload instantly, process with AI, and download high-quality results.
            </p>
            {user ? (
              <p className="text-lg text-gray-700">Hello <span className="font-semibold text-blue-600">{user.firstName || user.emailAddresses[0].emailAddress}</span>! Choose a tool to get started.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-700">Try our tools instantly. Login only required for downloads.</p>
                <div className="flex gap-4 justify-center">
                  <Link href="/sign-in" className="btn-primary">Sign In</Link>
                  <Link href="/sign-up" className="btn-secondary">Sign Up</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Powerful Image Processing Tools</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Professional-grade image processing tools powered by AI. Each tool is designed to deliver exceptional results with just a few clicks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="modern-card p-6 text-center group">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
              <Link href={feature.href} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Try Now <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Upload Image</h3>
              <p className="text-gray-600">Choose any image from your device. No account needed to start processing.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">AI Processing</h3>
              <p className="text-gray-600">Our AI processes your image instantly with professional-grade algorithms.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Download Results</h3>
              <p className="text-gray-600">Sign in to download your processed image in high quality.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Details */}
      <div className="container mx-auto px-6 py-12 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Why Choose ImageCraft Pro?</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Lightning Fast Processing</h3>
                <p className="text-gray-600">Advanced AI algorithms process your images in seconds, not minutes.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Professional Quality</h3>
                <p className="text-gray-600">Industry-grade tools that deliver professional results every time.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Easy to Use</h3>
                <p className="text-gray-600">Simple interface that anyone can use, no technical expertise required.</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="modern-card p-8 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="bg-gray-800 rounded-t-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1 bg-gray-700 rounded px-3 py-1 ml-4">
                    <span className="text-gray-300 text-sm">https://imagecraft-pro.com</span>
                  </div>
                </div>
              </div>
              <div className="py-16">
                <ImageIcon className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Upload & Process</h3>
                <p className="text-gray-600">Drag, drop, and transform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;