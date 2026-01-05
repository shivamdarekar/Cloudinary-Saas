"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import ProcessingResult from "../../../components/ProcessingResult";

function ImageCompressor() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setProcessedImage(null);
    setCompressedSize(0);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProcessedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetSize", targetSize.toString());

    try {
      const response = await axios.post("/api/image-compress", formData);
      setProcessedImage(response.data.url);
      setCompressedSize(response.data.compressedSize);
      toast.success("Image compressed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Compression failed");
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
        // Fetch the image as a blob
        const response = await fetch(processedImage);
        const blob = await response.blob();
        
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `compressed-${file?.name || 'image.jpg'}`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Delete from Cloudinary after successful download
        const publicId = processedImage.split('/').pop()?.split('.')[0];
        if (publicId) {
          await fetch('/api/delete-image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: `compressed-images/${publicId}` })
          });
        }
        
        toast.success("Download completed successfully!");
      } catch (error) {
        console.error('Download failed:', error);
        toast.error("Download failed. Please try again.");
      }
    }
  };

  return (
    <div className="bg-gray-50 py-6">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Image Compressor</h1>
          <p className="text-gray-600">Compress your images to any size in KB with AI-powered optimization</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
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

            {/* Target Size Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target size (KB)
              </label>
              <input
                type="number"
                value={targetSize}
                onChange={(e) => setTargetSize(Number(e.target.value) || 0)}
                className="input-modern w-full"
                min="10"
                max="5000"
                placeholder="Enter target size in KB"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 50-500 KB for web images
              </p>
            </div>

            {/* Compress Button */}
            <button
              onClick={handleCompress}
              disabled={!file || isProcessing}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Compressing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Compress Image
                </>
              )}
            </button>
          </div>

          {/* Preview Section */}
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Preview & Download
            </h2>

            <ProcessingResult
              processedImage={processedImage}
              originalSize={originalSize}
              processedSize={compressedSize}
              isProcessing={isProcessing}
              onDownload={handleDownload}
              user={user}
              emptyStateText="Upload and compress an image"
              showStats={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCompressor;