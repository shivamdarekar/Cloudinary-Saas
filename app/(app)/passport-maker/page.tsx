"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import Dropdown from "../../../components/Dropdown";
import AuthDialog from "../../../components/AuthDialog";
import { useAuthDialog } from "../../../lib/useAuthDialog";
import { downloadImage } from "../../../lib/fileUtils";
import { useCloudinaryDelete } from "../../../lib/useCloudinaryDelete";
import { saveProcessingState, getProcessingState, clearProcessingState } from "../../../lib/workPreservation";

// Official document photo sizes (in pixels at 300 DPI)
const PASSPORT_PRESETS = {
  "passport-india": { width: 413, height: 531, name: "Indian Passport", description: "35×45mm (413×531px)" },
  "passport-us": { width: 600, height: 600, name: "US Passport", description: "2×2 inch (600×600px)" },
  "visa-us": { width: 600, height: 600, name: "US Visa", description: "2×2 inch (600×600px)" },
  "aadhar": { width: 413, height: 531, name: "Aadhar Card", description: "35×45mm (413×531px)" },
  "pan-card": { width: 413, height: 531, name: "PAN Card", description: "35×45mm (413×531px)" },
  "driving-license": { width: 413, height: 531, name: "Driving License", description: "35×45mm (413×531px)" },
  "school-id": { width: 295, height: 413, name: "School ID", description: "25×35mm (295×413px)" },
  "resume-photo": { width: 295, height: 413, name: "Resume Photo", description: "25×35mm (295×413px)" }
};

const passportOptions = Object.entries(PASSPORT_PRESETS).map(([key, preset]) => ({
  value: key,
  label: preset.name,
  description: preset.description
}));

function PassportMaker() {
  const { user, isLoaded } = useUser();
  const { deleteImage } = useCloudinaryDelete();
  const { isOpen, mode, openSignIn, openSignUp, close } = useAuthDialog();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("passport-india");
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>("white");
  const [zoomLevel, setZoomLevel] = useState<number>(0.75);

  // Restore processing state after authentication
  useEffect(() => {
    if (isLoaded && user) {
      const savedState = getProcessingState();
      if (savedState && savedState.processingType === 'passport-maker') {
        setProcessedImage(savedState.processedImage);
        toast.success('Your passport photo has been restored!', { duration: 3000 });
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

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const dimensions = PASSPORT_PRESETS[selectedPreset as keyof typeof PASSPORT_PRESETS];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("preset", selectedPreset);
    formData.append("width", dimensions.width.toString());
    formData.append("height", dimensions.height.toString());
    formData.append("backgroundColor", backgroundColor);
    formData.append("zoom", zoomLevel.toString());

    try {
      const response = await fetch("/api/passport-resize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Processing failed");
      
      const data = await response.json();
      setProcessedImage(data.url);
      
      // Save processing state for potential authentication flow
      if (!user) {
        saveProcessingState({
          processedImage: data.url,
          originalSize: file.size,
          compressedSize: file.size, // Estimate same size
          fileName: file.name,
          processingType: 'passport-maker'
        });
      }
      
      toast.success("Passport photo created successfully!", { duration: 3000 });
    } catch (error: any) {
      toast.error("Processing failed. Please try again.", { duration: 5000 });
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
          processingType: 'passport-maker'
        });
      }
      toast.error("Please sign in to download your passport photo");
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
          `${selectedPreset}-photo-${file?.name}`
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

  const currentPreset = PASSPORT_PRESETS[selectedPreset as keyof typeof PASSPORT_PRESETS];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Passport Photo Maker</h1>
          <p className="text-gray-600">Create perfect passport & ID photos for official documents</p>
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
              options={passportOptions}
              value={selectedPreset}
              onChange={handlePresetChange}
              label="Document Type"
              placeholder="Select document type"
              className="mb-6"
            />

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                {["white", "lightblue", "lightgray"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-12 h-12 rounded-lg border-2 ${
                      backgroundColor === color ? 'border-green-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Level: {zoomLevel === 0.5 ? 'Face Only' : zoomLevel === 0.65 ? 'Face + Neck' : zoomLevel === 0.75 ? 'With Shoulders' : 'Full Upper Body'}
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(zoomLevel - 0.5) / 0.5 * 100}%, #e5e7eb ${(zoomLevel - 0.5) / 0.5 * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Tight Crop</span>
                <span>Include More</span>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="btn-primary w-full"
            >
              {isProcessing ? "Processing..." : "Create Passport Photo"}
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
                    alt="Passport photo"
                    className="rounded-lg shadow-lg"
                    style={{ maxHeight: '400px' }}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {currentPreset.name} - {currentPreset.description}
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
                    Select document type and click "Create Passport Photo"
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Upload a photo to create passport size image</p>
                  <p className="text-sm mt-2">Face should be clearly visible and centered</p>
                </div>
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

export default PassportMaker;