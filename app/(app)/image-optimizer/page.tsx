"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import ProcessingResult from "../../../components/ProcessingResult";
import { useCloudinaryDelete } from "../../../lib/useCloudinaryDelete";

function ImageOptimizer() {
  const { user } = useUser();
  const { deleteImage } = useCloudinaryDelete();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [optimizedSize, setOptimizedSize] = useState<number>(0);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setProcessedImage(null);
    setOptimizedSize(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProcessedImage(null);
    setOriginalSize(0);
    setOptimizedSize(0);
  };

  const handleOptimize = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("settings", JSON.stringify({
      width: width,
      height: height,
      quality: quality,
      format: "auto"
    }));

    try {
      const response = await fetch("/api/image-optimize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to optimize image");
      }

      const data = await response.json();
      setProcessedImage(data.optimizedUrl);
      // Optimized images are typically smaller
      setOptimizedSize(Math.floor(originalSize * (quality / 100) * 0.7));
      toast.success("Image optimized successfully!");
    } catch (error: any) {
      console.error("Image optimization error:", error);
      toast.error(error.message || "Failed to optimize image");
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
      try {
        // Fetch as blob to force download
        const response = await fetch(processedImage);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `optimized-${file?.name || 'image.jpg'}`;
        document.body.appendChild(link);
        link.click();
        
        // Wait a moment to ensure download started
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Optimized image downloaded successfully!");
        
        // ✅ Only delete if download was successful
        await deleteImage(processedImage);
        console.log('🗑️ Optimized image deleted from Cloudinary');
      } catch (error) {
        console.error('Download error:', error);
        // ❌ Don't delete if download failed - user can retry
        toast.error("Download failed. Click download to try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Image Optimizer</h1>
          <p className="text-gray-600">Optimize images for web and mobile with custom dimensions and quality</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Upload & Configure
            </h2>
            
            <ImageUpload
              file={file}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              className="mb-6"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="input-modern w-full"
                  min="100"
                  max="4000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="input-modern w-full"
                  min="100"
                  max="4000"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleOptimize}
              disabled={!file || isProcessing}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Optimize Image
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
              processedSize={optimizedSize}
              isProcessing={isProcessing}
              onDownload={handleDownload}
              user={user}
              emptyStateText="Upload and optimize an image"
              showStats={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageOptimizer;