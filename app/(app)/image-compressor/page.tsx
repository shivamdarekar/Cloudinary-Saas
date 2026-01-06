"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Zap } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import ProcessingResult from "../../../components/ProcessingResult";
import WorkRestoredNotification from "../../../components/WorkRestoredNotification";
import AuthDialog from "../../../components/AuthDialog";
import { useAuthDialog } from "../../../lib/useAuthDialog";
import { useCloudinaryDelete } from "../../../lib/useCloudinaryDelete";
import { downloadImage } from "../../../lib/fileUtils";
import { saveProcessingState, getProcessingState, clearProcessingState } from "../../../lib/workPreservation";

function ImageCompressor() {
  const { user, isLoaded } = useUser();
  const { deleteImage } = useCloudinaryDelete();
  const { isOpen, mode, openSignIn, openSignUp, close } = useAuthDialog();
  const [file, setFile] = useState<File | null>(null);
  const [targetSize, setTargetSize] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [originalPublicId, setOriginalPublicId] = useState<string | null>(null);
  const [showWorkRestored, setShowWorkRestored] = useState(false);

  // Restore processing state after authentication
  useEffect(() => {
    if (isLoaded && user) {
      const savedState = getProcessingState();
      if (savedState && savedState.processingType === 'compress') {
        setProcessedImage(savedState.processedImage);
        setOriginalSize(savedState.originalSize);
        setCompressedSize(savedState.compressedSize);
        if (savedState.targetSize) {
          setTargetSize(savedState.targetSize);
        }
        setShowWorkRestored(true);
        // Clear the saved state after restoration
        clearProcessingState();
      }
    }
  }, [isLoaded, user]);

  // Prevent page refresh during processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Processing in progress. Are you sure you want to leave?';
        return 'Processing in progress. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setProcessedImage(null);
    setCompressedSize(0);
    // Clear any previous processing state when starting new
    clearProcessingState();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProcessedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
  };

  const handleCompress = async () => {
    if (!file) return;
    if (isProcessing) return; // Prevent double processing

    // Validate target size
    const targetSizeBytes = targetSize * 1024;
    const minTargetSize = Math.max(1, Math.floor(file.size * 0.01)); // At least 1% of original
    
    if (targetSizeBytes >= file.size) {
      toast.error('Target size must be smaller than original file size', { duration: 5000 });
      return;
    }
    
    if (targetSizeBytes < minTargetSize) {
      toast.error(`Target size too small. Minimum: ${Math.ceil(minTargetSize / 1024)}KB`, { duration: 5000 });
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetSize", targetSize.toString());

    let retryCount = 0;
    const maxRetries = 3;

    const attemptCompress = async (): Promise<void> => {
      try {
        const response = await axios.post("/api/image-compress", formData, {
          timeout: 30000 // 30 second timeout
        });
        setProcessedImage(response.data.url);
        setCompressedSize(response.data.compressedSize);
        setOriginalPublicId(response.data.publicId); // Store original image publicId
        
        // Save processing state for potential authentication flow
        if (!user) {
          saveProcessingState({
            processedImage: response.data.url,
            originalSize: originalSize,
            compressedSize: response.data.compressedSize,
            fileName: file.name,
            targetSize: targetSize,
            processingType: 'compress'
          });
        }
        
        toast.success("Image compressed successfully!", { duration: 3000 });
      } catch (error: any) {
        const isRetryable = error.code === 'ECONNABORTED' || 
                           error.code === 'NETWORK_ERROR' || 
                           error.response?.status >= 500;
        
        if (retryCount < maxRetries && isRetryable) {
          retryCount++;
          toast.error(`Network error. Retrying... (${retryCount}/${maxRetries})`, { duration: 4000 });
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attemptCompress();
        } else {
          toast.error(error.response?.data?.error || "Compression failed", { duration: 5000 });
          throw error;
        }
      }
    };

    try {
      await attemptCompress();
    } catch (error) {
      // Error already shown
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
          originalSize,
          compressedSize,
          fileName: file.name,
          targetSize,
          processingType: 'compress'
        });
      }
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
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const success = await downloadImage(
          processedImage,
          `compressed-${file?.name || 'image.jpg'}`
        );
        
        if (success) {
          toast.success("Download completed successfully!", { duration: 3000 });
          clearProcessingState();
          // Delete both original and compressed images from Cloudinary
          if (originalPublicId) {
            await deleteImage(originalPublicId);
          }
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
          toast.error("Download failed. Click download to try again.", { duration: 5000 });
          return false;
        }
      }
    };

    await attemptDownload();
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
              onSignInClick={openSignIn}
              onSignUpClick={openSignUp}
            />
          </div>
        </div>
        
        <WorkRestoredNotification
          show={showWorkRestored}
          onClose={() => setShowWorkRestored(false)}
          processingType="compressed"
        />
      </div>
      
      <AuthDialog
        isOpen={isOpen}
        mode={mode}
        onClose={close}
      />
    </div>
  );
}

export default ImageCompressor;