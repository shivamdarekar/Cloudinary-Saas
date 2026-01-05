"use client";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "../../../components/ImageUpload";
import ProcessingResult from "../../../components/ProcessingResult";

function AutoTagger() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setProcessedImage(null);
    setTags([]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProcessedImage(null);
    setOriginalSize(0);
    setTags([]);
  };

  const handleGenerateTags = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/auto-tag", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate tags");
      }

      const data = await response.json();
      setProcessedImage(data.imageUrl);
      setTags(data.tags || []);
      toast.success("Tags generated successfully!");
    } catch (error: any) {
      console.error("Auto tagging error:", error);
      toast.error(error.message || "Failed to generate tags");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!user) {
      toast.error("Please sign in to download");
      window.location.href = "/sign-in";
      return;
    }
    
    if (tags.length > 0) {
      const tagData = {
        filename: file?.name,
        tags: tags,
        generated_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(tagData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tags-${file?.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Tags downloaded successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Auto Tagger</h1>
          <p className="text-gray-600">Generate AI-powered tags and metadata for your images automatically</p>
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

            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-purple-900 mb-2">AI Tag Generation:</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Identifies objects and subjects</li>
                <li>• Detects colors and composition</li>
                <li>• Recognizes scenes and activities</li>
                <li>• Generates SEO-friendly keywords</li>
              </ul>
            </div>

            <button
              onClick={handleGenerateTags}
              disabled={!file || isProcessing}
              className="btn-primary w-full flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Tags...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  Generate Tags
                </>
              )}
            </button>
          </div>

          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Generated Tags
            </h2>

            {isProcessing ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Analyzing your image...</p>
                  <p className="text-gray-500 text-sm">Generating relevant tags</p>
                </div>
              </div>
            ) : processedImage && tags.length > 0 ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                  <img
                    src={processedImage}
                    alt="Tagged"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Generated Tags ({tags.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {!user && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium">Sign in required</p>
                    <p className="text-yellow-700 text-sm">Please sign in to download the tag data</p>
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Download Tags (JSON)
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Upload an image to generate tags</p>
                  <p className="text-gray-500 text-sm">AI will analyze and create relevant tags</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoTagger;