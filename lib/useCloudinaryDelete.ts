import { useState } from 'react';
import { toast } from 'sonner';

export const useCloudinaryDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const extractPublicId = (url: string): string | null => {
    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1) return null;
      
      // Get folder + filename without extension
      const folderAndFile = parts.slice(uploadIndex + 2).join('/');
      return folderAndFile.replace(/\.[^/.]+$/, ''); // Remove extension
    } catch {
      return null;
    }
  };

  const deleteImage = async (imageUrl: string, showToast = false): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const publicId = extractPublicId(imageUrl);
      if (!publicId) {
        console.error('Invalid image URL, cannot extract publicId');
        return false;
      }

      console.log('Deleting image with publicId:', publicId);

      const response = await fetch('/api/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      console.log('✅ Image deleted successfully');
      if (showToast) {
        toast.success('Image deleted successfully');
      }
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      if (showToast) {
        toast.error('Failed to delete image');
      }
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteImage, isDeleting, extractPublicId };
};
