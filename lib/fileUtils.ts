export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const downloadImage = async (
  imageUrl: string, 
  filename: string
): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Wait to ensure download started
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    return false;
  }
};

export const extractFileFormat = (file: File): string => {
  let format = "UNKNOWN";
  
  // Try getting from MIME type first
  if (file.type && file.type.includes('/')) {
    const mimeFormat = file.type.split('/')[1];
    if (mimeFormat) {
      format = mimeFormat.toUpperCase();
    }
  }
  
  // Fallback: extract from filename extension
  if (format === "UNKNOWN" && file.name) {
    const nameParts = file.name.split('.');
    if (nameParts.length > 1) {
      const ext = nameParts.pop();
      if (ext) {
        format = ext.toUpperCase();
      }
    }
  }
  
  return format;
};
