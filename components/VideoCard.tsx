import React, { useState, useEffect, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import { Video } from "@/types";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  // pass Cloudinary publicId and title to the download handler (server proxy will stream the file)
  onDownload: (publicId: string, title: string) => void;
  onDelete?: () => Promise<void>; // Add onDelete prop (optional)
  showActions?: boolean; // Ensure showActions is optional
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload,onDelete, showActions  }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Thumbnail URL
  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 400,
      height: 225,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  // Full Video URL
  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
      format: "mp4", // Ensures proper format
    });
  }, []);

  // Preview Video URL with optimized transformations
  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 225,
      rawTransformations: ["e_preview:duration_10"]
      // Ensures correct preview settings
    });
  }, []);

  // Format file size
  const formatSize = useCallback((size: number) => {
    return size ? filesize(size) : "N/A"; // Avoids errors if size is missing
  }, []);

  // Format video duration properly
  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds || seconds <= 0) return "00:00"; // Prevents NaN issues
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // Calculate compression percentage safely
  const compressionPercentage =
  video.originalSize && video.compressedSize
    ? Math.max(
        0,
        Math.round((1 - Number(video.compressedSize) / Number(video.originalSize)) * 100)
      )
    : 0;


  useEffect(() => {
    setPreviewError(false);
  }, [isHovered]);

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  return (
    <div
      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="aspect-video relative">
        {isHovered ? (
          previewError ? (
            <img
              src={getThumbnailUrl(video.publicId)}
              alt="Fallback Thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={getPreviewVideoUrl(video.publicId)}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
              onError={handlePreviewError}
            />
          )
        ) : (
          <img
            src={getThumbnailUrl(video.publicId)}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
          <Clock size={16} className="mr-1" />
          {formatDuration(video.duration)}
        </div>
      </figure>
      <div className="card-body p-4">
        <h2 className="card-title text-lg font-bold">{video.title}</h2>
        <p className="text-sm text-base-content opacity-70 mb-2">{video.description}</p>
        <p className="text-sm text-base-content opacity-70 mb-2">
          Uploaded {dayjs(video.createdAt).fromNow()}
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <FileUp size={18} className="mr-2 text-primary" />
            <div>
              <div className="font-semibold">Original</div>
              <div>{formatSize(Number(video.originalSize))}</div>
            </div>
          </div>
          <div className="flex items-center">
            <FileDown size={18} className="mr-2 text-secondary" />
            <div>
              <div className="font-semibold">Compressed</div>
              <div>{formatSize(Number(video.compressedSize))}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm font-semibold">
            Compression: <span className="text-accent">{compressionPercentage}%</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            // pass publicId instead of full URL so the client can call the server proxy
            onClick={() => onDownload(video.publicId, video.title)}
          >
            <Download size={16} />
          </button>
          {showActions && onDelete && (
          <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none 
          focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-all cursor-pointer"
        >
          Delete
        </button>
        
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;