"use client";
import React from 'react';
import { Download } from 'lucide-react';

interface ProcessingResultProps {
  processedImage: string | null;
  originalSize?: number;
  processedSize?: number;
  isProcessing: boolean;
  onDownload: () => void;
  user: any;
  emptyStateText?: string;
  showStats?: boolean;
  children?: React.ReactNode;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

export default function ProcessingResult({
  processedImage,
  originalSize,
  processedSize,
  isProcessing,
  onDownload,
  user,
  emptyStateText = "Upload and process an image",
  showStats = true,
  children,
  onSignInClick,
  onSignUpClick
}: ProcessingResultProps) {

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Processing your image...</p>
          <p className="text-gray-500 text-sm">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!processedImage) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🖼️</span>
          </div>
          <p className="text-gray-600 font-medium">{emptyStateText}</p>
          <p className="text-gray-500 text-sm">Your processed image will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
        <img
          src={processedImage}
          alt="Processed"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Size Comparison */}
      {showStats && originalSize && processedSize && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Original</p>
              <p className="text-lg font-semibold text-gray-900">{formatFileSize(originalSize)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">Processed</p>
              <p className="text-lg font-semibold text-green-600">{formatFileSize(processedSize)}</p>
            </div>
          </div>

          {/* Compression Stats */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Size reduction:</span> {((1 - processedSize / originalSize) * 100).toFixed(1)}%
            </p>
          </div>
        </>
      )}

      {/* Custom content */}
      {children}

      {/* Authentication or Download Section */}
      {!user ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Sign in required to download your processed image
          </p>
          
          <button
            onClick={onSignInClick}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Sign In to Download
          </button>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <button
              onClick={onSignUpClick}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline bg-transparent border-none cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onDownload}
          className="btn-primary w-full flex items-center justify-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Processed Image
        </button>
      )}
    </div>
  );
}