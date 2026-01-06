// Utility to preserve user work during authentication flow

export interface ProcessingState {
  processedImage: string | null;
  originalSize: number;
  compressedSize: number;
  fileName: string | null;
  targetSize?: number;
  processingType: string;
  timestamp: number;
}

const STORAGE_KEY = 'imagecraft_processing_state';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export const saveProcessingState = (state: Omit<ProcessingState, 'timestamp'>) => {
  try {
    const stateWithTimestamp: ProcessingState = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.error('Failed to save processing state:', error);
  }
};

export const getProcessingState = (): ProcessingState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state: ProcessingState = JSON.parse(stored);
    
    // Check if state has expired
    if (Date.now() - state.timestamp > EXPIRY_TIME) {
      clearProcessingState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to get processing state:', error);
    clearProcessingState();
    return null;
  }
};

export const clearProcessingState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear processing state:', error);
  }
};

export const hasProcessingState = (): boolean => {
  return getProcessingState() !== null;
};