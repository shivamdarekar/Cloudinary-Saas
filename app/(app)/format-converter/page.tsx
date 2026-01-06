"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import Dropdown from "../../../components/Dropdown";
import { useCloudinaryDelete } from "../../../lib/useCloudinaryDelete";
import { downloadImage, extractFileFormat } from "../../../lib/fileUtils";
import { saveProcessingState, getProcessingState, clearProcessingState } from "../../../lib/workPreservation";

const FORMAT_OPTIONS = [
  { value: "jpg", label: "JPG", description: "Best for photos" },
  { value: "png", label: "PNG", description: "Best for transparency" },
  { value: "webp", label: "WebP", description: "Modern, smaller size" },
  { value: "avif", label: "AVIF", description: "Next-gen format" },
  { value: "gif", label: "GIF", description: "Animations" },
];

const QUALITY_OPTIONS = [
  { value: "auto", label: "Auto", description: "Let Cloudinary decide" },
  { value: "100", label: "Best (100%)", description: "Highest quality" },
  { value: "80", label: "High (80%)", description: "Great quality" },
  { value: "60", label: "Medium (60%)", description: "Balanced" },
  { value: "40", label: "Low (40%)", description: "Smaller size" },
];

export default function FormatConverter() {
  const { user, isLoaded } = useUser();
  const { deleteImage } = useCloudinaryDelete();
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState("webp");
  const [quality, setQuality] = useState("auto");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [originalFormat, setOriginalFormat] = useState<string>("");
  const [convertedSize, setConvertedSize] = useState<number>(0);

  // Restore processing state after authentication
  useEffect(() => {
    if (isLoaded && user) {
      const savedState = getProcessingState();
      if (savedState && savedState.processingType === 'format-convert') {
        setConvertedImage(savedState.processedImage);
        setConvertedSize(savedState.compressedSize);
        toast.success('Your converted image has been restored!');
        clearProcessingState();
      }
    }
  }, [isLoaded, user]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setConvertedImage(null);
    setOriginalFormat(extractFileFormat(selectedFile));
  };

  const handleConvert = async () => {
    if (!file) return;
    
    setIsConverting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", targetFormat);
    formData.append("quality", quality);

    try {
      const response = await fetch("/api/format-convert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || "Conversion failed";
        // console.error('Conversion error:', errorMessage);
        if (data.details) {
          // console.error('Error details:', data.details);
        }
        throw new Error(errorMessage);
      }
      
      setConvertedImage(data.url);
      setConvertedSize(data.size);
      
      // Save processing state for potential authentication flow
      if (!user) {
        saveProcessingState({
          processedImage: data.url,
          originalSize: file.size,
          compressedSize: data.size,
          fileName: file.name,
          processingType: 'format-convert'
        });
      }
      toast.success(`Converted to ${targetFormat.toUpperCase()}!`);
    } catch (error: any) {
      // console.error('Format conversion error:', error);
      toast.error(error.message || "Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      // Save state before redirecting
      if (convertedImage && file) {
        saveProcessingState({
          processedImage: convertedImage,
          originalSize: file.size,
          compressedSize: convertedSize,
          fileName: file.name,
          processingType: 'format-convert'
        });
      }
      toast.error("Please sign in to download");
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!convertedImage) return;

    let retryCount = 0;
    const maxRetries = 3;

    const attemptDownload = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(convertedImage, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const success = await downloadImage(
          convertedImage,
          `converted-${file?.name?.split('.')[0] || 'image'}.${targetFormat}`
        );
        
        if (success) {
          toast.success("Download completed!");
          clearProcessingState();
          await deleteImage(convertedImage);
          return true;
        } else {
          throw new Error('Download failed');
        }
      } catch (error: any) {
        const isRetryable = 
          error.name === 'AbortError' || 
          error.name === 'TypeError' || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('Network') ||
          (error.message?.includes('HTTP') && /5\d{2}/.test(error.message));
        
        if (retryCount < maxRetries && isRetryable) {
          retryCount++;
          toast.error(`Download failed. Retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attemptDownload();
        } else {
          toast.error("Download failed. Click download to try again.");
          return false;
        }
      }
    };

    await attemptDownload();
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-gray-900">Format Converter</h1>
          <p className="text-gray-600">
            Convert your images to any format - JPG, PNG, WebP, AVIF, and more
          </p>
        </div>

        {/* Upload Section */}
        <div className="modern-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload Image</h2>
          <ImageUpload
            onFileSelect={handleFileSelect}
            file={file}
            onRemoveFile={() => {
              setFile(null);
              setConvertedImage(null);
            }}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Original Format: <span className="font-semibold">{originalFormat}</span>
            </p>
          )}
        </div>

        {/* Settings */}
        {file && (
          <div className="modern-card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Conversion Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Dropdown
                label="Target Format"
                options={FORMAT_OPTIONS}
                value={targetFormat}
                onChange={setTargetFormat}
              />
              <Dropdown
                label="Quality"
                options={QUALITY_OPTIONS}
                value={quality}
                onChange={setQuality}
              />
            </div>
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="btn-primary w-full mt-4"
            >
              {isConverting ? "Converting..." : "Convert Image"}
            </button>
          </div>
        )}

        {/* Result */}
        {convertedImage && (
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Converted Image</h2>
            <img
              src={convertedImage}
              alt="Converted"
              className="w-full rounded-lg mb-4"
            />
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Format: <span className="font-semibold">{targetFormat.toUpperCase()}</span>
              </p>
              {user && (
                <button onClick={handleDownload} className="btn-primary">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}