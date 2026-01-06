"use client";
import React, { useRef, useState } from 'react';
import { Upload, X, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onRemoveFile: () => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function ImageUpload({ 
  onFileSelect, 
  file, 
  onRemoveFile, 
  accept = "image/*,.heic,.heif",
  maxSize = 10,
  className = ""
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 1) {
      toast.error('Please upload only one image at a time', { duration: 4000 });
      return;
    }
    if (files && files[0]) {
      validateAndSelectFile(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 1) {
      toast.error('Please select only one image at a time', { duration: 4000 });
      e.target.value = '';
      return;
    }
    
    const selectedFile = files?.[0];
    // console.log('File selected:', selectedFile?.name || 'No file');
    
    if (selectedFile) {
      // console.log('File details:', {
      //   name: selectedFile.name,
      //   type: selectedFile.type,
      //   size: selectedFile.size
      // });
      validateAndSelectFile(selectedFile);
    } else {
      // console.log('No file selected from input');
    }
    
    // IMPORTANT: Reset input to allow re-selecting the same file
    e.target.value = '';
  };

  const validateAndSelectFile = (selectedFile: File) => {
    // console.log('Starting validation for:', selectedFile.name);
    
    // Check if file exists
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    // Enhanced file validation
    const isImage = selectedFile.type.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(selectedFile.name);
    
    if (!isImage) {
      toast.error('Please select a valid image file (JPG, PNG, WebP, GIF, HEIC)', { duration: 5000 });
      return;
    }

    // Check for corrupted files - basic validation
    if (selectedFile.size === 0) {
      toast.error('File appears to be corrupted or empty');
      return;
    }

    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`File size must be less than ${maxSize}MB`, { duration: 4000 });
      return;
    }

    // Additional validation for image integrity
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // File is valid image
        try {
          onFileSelect(selectedFile);
          toast.success('Image selected successfully!', { duration: 3000 });
        } catch (error) {
          toast.error('Failed to process the image');
        }
      };
      img.onerror = () => {
        toast.error('File appears to be corrupted or not a valid image');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      toast.error('Unable to read file. It may be corrupted');
    };
    reader.readAsDataURL(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleButtonClick = () => {
    // console.log('Upload button clicked - triggering file input');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      {!file ? (
        <div 
          className={`upload-area p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive ? 'dragover' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            id="file-upload-input"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Drop your image here</p>
          <p className="text-gray-500 mb-4">or click to browse</p>
          <p className="text-sm text-gray-400">
            Supports: JPG, PNG, WebP, GIF, HEIC (max {maxSize}MB)
          </p>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <FileImage className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                <p className="text-sm text-gray-600">
                  Size: {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Remove file clicked');
                onRemoveFile();
              }}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0 ml-2"
              title="Remove file"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}