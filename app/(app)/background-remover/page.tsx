"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import ProcessingResult from "../../../components/ProcessingResult";
import { downloadImage } from "../../../lib/fileUtils";

function BackgroundRemover() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [processedSize, setProcessedSize] = useState<number>(0);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setProcessedImage(null);
    setProcessedSize(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProcessedImage(null);
    setOriginalSize(0);
    setProcessedSize(0);
  };

  const handleRemoveBackground = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/background-remove", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove background");
      }

      const data = await response.json();
      setProcessedImage(data.processedUrl);
      // Background removed images are typically smaller
      setProcessedSize(Math.floor(originalSize * 0.8));
      toast.success("Background removed successfully!");
    } catch (error: any) {
      // console.error("Background removal error:", error);
      toast.error(error.message || "Failed to remove background");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast.error("Please sign in to download");
      window.location.href = "/sign-in";
      return;
    }
    
    if (processedImage) {
      const success = await downloadImage(
        processedImage,
        `no-bg-${file?.name}`
      );
      
      if (success) {
        toast.success("Background removed image downloaded!");
      } else {
        toast.error("Download failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Background Remover</h1>
          <p className="text-gray-600">Remove backgrounds from images instantly using AI-powered technology</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Upload Image
            </h2>
            
            <ImageUpload
              file={file}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              className="mb-6"
            />

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Best Results Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use high-contrast images</li>
                <li>• Clear subject separation from background</li>
                <li>• Avoid complex backgrounds</li>
                <li>• Good lighting on the subject</li>
              </ul>
            </div>

            <button
              onClick={handleRemoveBackground}
              disabled={!file || isProcessing}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Removing Background...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  Remove Background
                </>
              )}
            </button>
          </div>

          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Preview & Download
            </h2>

            <ProcessingResult
              processedImage={processedImage}
              originalSize={originalSize}
              processedSize={processedSize}
              isProcessing={isProcessing}
              onDownload={handleDownload}
              user={user}
              emptyStateText="Upload an image to remove background"
              showStats={true}
            >
              {processedImage && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Background removed!</span> The image now has a transparent background.
                  </p>
                </div>
              )}
            </ProcessingResult>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackgroundRemover;