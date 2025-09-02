"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/types";
import { useUser } from "@clerk/nextjs"; // Clerk for authentication

function MyVideos() {
  const { user, isLoaded } = useUser();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyVideos = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get(`/api/myvideos?userId=${user.id}`);
      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to fetch your videos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) fetchMyVideos();
  }, [isLoaded, fetchMyVideos]);

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      await axios.delete(`/api/videos/${videoId}`);
      setVideos((prev) => prev.filter((video) => video.id !== videoId));
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
    }
  };

  const handleDownload = useCallback(async (url: string, title: string) => {
    try {
        const response = await axios.get(url, { responseType: "blob" }); // Fetch as blob
        const blob = new Blob([response.data], { type: "video/mp4" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${title}.mp4`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up memory
    } catch (error) {
        console.error("Error downloading video:", error);
    }
}, []);

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your videos.</div>;
  if (loading) return <div>Loading videos...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Videos</h1>
      {videos.length === 0 ? (
        <div className="text-center text-lg text-gray-500">No videos uploaded yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={handleDownload}
              onDelete={() => handleDelete(video.id)}
              showActions={true} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyVideos;