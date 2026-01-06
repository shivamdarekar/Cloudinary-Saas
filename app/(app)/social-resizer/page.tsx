"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import Dropdown from "../../../components/Dropdown";
import AuthDialog from "../../../components/AuthDialog";
import { useAuthDialog } from "../../../lib/useAuthDialog";
import { downloadImage } from "../../../lib/fileUtils";
import { useCloudinaryDelete } from "../../../lib/useCloudinaryDelete";
import { saveProcessingState, getProcessingState, clearProcessingState } from "../../../lib/workPreservation";

// Social media dimensions
const SOCIAL_PRESETS = {
  "facebook-cover": { width: 1200, height: 630, name: "Facebook Cover", description: "1200 × 630 pixels" },
  "facebook-profile": { width: 400, height: 400, name: "Facebook Profile", description: "400 × 400 pixels" },
  "instagram-post": { width: 1080, height: 1080, name: "Instagram Post", description: "1080 × 1080 pixels" },
  "instagram-story": { width: 1080, height: 1920, name: "Instagram Story", description: "1080 × 1920 pixels" },
  "linkedin-cover": { width: 1584, height: 396, name: "LinkedIn Cover", description: "1584 × 396 pixels" },
  "linkedin-profile": { width: 400, height: 400, name: "LinkedIn Profile", description: "400 × 400 pixels" },
  "twitter-header": { width: 1500, height: 500, name: "Twitter Header", description: "1500 × 500 pixels" },
  "youtube-thumbnail": { width: 1280, height: 720, name: "YouTube Thumbnail", description: "1280 × 720 pixels" }
};

const socialOptions = Object.entries(SOCIAL_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.name,
  description: preset.description
}));

function SocialResizer() {
  const { user, isLoaded } = useUser();
  const { deleteImage } = useCloudinaryDelete();
  const { isOpen, mode, openSignIn, openSignUp, close } = useAuthDialog();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("facebook-cover");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // Restore processing state after authentication
  useEffect(() => {
    if (isLoaded && user) {
      const savedState = getProcessingState();
      if (savedState && savedState.processingType === 'social-resizer') {
        setProcessedImage(savedState.processedImage);
        toast.success('Your resized image has been restored!', { duration: 3000 });
        clearProcessingState();
      }
    }
  }, [isLoaded, user]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedImage(null);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setProcessedImage(null);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    // Remove auto-preview to avoid API errors
  };

  const handleResize = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const dimensions = SOCIAL_PRESETS[selectedPreset as keyof typeof SOCIAL_PRESETS];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("preset", selectedPreset);
    formData.append("width", dimensions.width.toString());
    formData.append("height", dimensions.height.toString());

    try {
      const response = await fetch("/api/social-resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Resize failed");
      
      const data = await response.json();
      setProcessedImage(data.url);
      
      // Save processing state for potential authentication flow
      if (!user) {
        saveProcessingState({
          processedImage: data.url,
          originalSize: file.size,
          compressedSize: file.size, // Estimate same size
          fileName: file.name,
          processingType: 'social-resizer'
        });
      }
      
      toast.success("Image resized successfully!", { duration: 3000 });
    } catch (error: any) {
      toast.error("Resize failed. Please try again.", { duration: 5000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      // Save state before showing auth dialog
      if (processedImage && file) {
        saveProcessingState({
          processedImage,
          originalSize: file.size,
          compressedSize: file.size,
          fileName: file.name,
          processingType: 'social-resizer'
        });
      }
      toast.error("Please sign in to download your resized image");
      openSignIn();
      return;
    }
    
    if (!processedImage) return;
    
    let retryCount = 0;
    const maxRetries = 3;

    const attemptDownload = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(processedImage, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const success = await downloadImage(
          processedImage,
          `${selectedPreset}-${file?.name}`
        );
        
        if (success) {
          toast.success("Download completed!", { duration: 3000 });
          clearProcessingState();
          await deleteImage(processedImage);
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
          toast.error(`Download failed. Retrying... (${retryCount}/${maxRetries})`, { duration: 4000 });
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attemptDownload();
        } else {
          toast.error("Download failed. Please try again.", { duration: 5000 });
          return false;
        }
      }
    };

    await attemptDownload();
  };

  const currentPreset = SOCIAL_PRESETS[selectedPreset as keyof typeof SOCIAL_PRESETS];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Social Media Resizer</h1>
          <p className="text-gray-600">Resize images for perfect social media posts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Upload & Settings */}
          <div className="modern-card p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Upload & Configure</h2>
            
            <ImageUpload
              file={file}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              className="mb-6"
            />

            <Dropdown
              options={socialOptions}
              value={selectedPreset}
              onChange={handlePresetChange}
              label="Social Media Format"
              placeholder="Select a social media format"
              className="mb-6"
            />

            <button
              onClick={handleResize}
              disabled={!file || isProcessing}
              className="btn-primary w-full"
            >
              {isProcessing ? "Processing..." : "Resize Image"}
            </button>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 modern-card p-4 lg:p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              {processedImage && (
                <button onClick={handleDownload} className="btn-secondary flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  {user ? "Download" : "Sign In to Download"}
                </button>
              )}
            </div>

            <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {processedImage ? (
                <div className="text-center">
                  <img
                    src={processedImage}
                    alt="Resized preview"
                    className="max-w-full max-h-96 rounded-lg shadow-lg"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {currentPreset.name} - {currentPreset.width} × {currentPreset.height}
                  </p>
                </div>
              ) : file ? (
                <div className="text-center">
                  <img
                    src={previewUrl || ""}
                    alt="Original"
                    className="max-w-full max-h-96 rounded-lg"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Select a format and click "Resize Image"
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Upload an image to see preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AuthDialog
        isOpen={isOpen}
        mode={mode}
        onClose={close}
      />
    </div>
  );
}

export default SocialResizer;