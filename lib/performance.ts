interface PerformanceMetrics {
  uploadStart: number;
  uploadEnd?: number;
  compressionStart?: number;
  compressionEnd?: number;
  totalTime?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  startUpload(sessionId: string): void {
    this.metrics.set(sessionId, {
      uploadStart: performance.now()
    });
  }

  endUpload(sessionId: string): void {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.uploadEnd = performance.now();
    }
  }

  startCompression(sessionId: string): void {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.compressionStart = performance.now();
    }
  }

  endCompression(sessionId: string): void {
    const metric = this.metrics.get(sessionId);
    if (metric) {
      metric.compressionEnd = performance.now();
      metric.totalTime = metric.compressionEnd - metric.uploadStart;
    }
  }

  getMetrics(sessionId: string): PerformanceMetrics | undefined {
    return this.metrics.get(sessionId);
  }

  cleanup(sessionId: string): void {
    this.metrics.delete(sessionId);
  }

  logPerformance(sessionId: string): void {
    const metric = this.metrics.get(sessionId);
    if (metric && metric.totalTime) {
      console.log(`Performance metrics for ${sessionId}:`, {
        uploadTime: metric.uploadEnd ? metric.uploadEnd - metric.uploadStart : 0,
        compressionTime: metric.compressionEnd && metric.compressionStart 
          ? metric.compressionEnd - metric.compressionStart : 0,
        totalTime: metric.totalTime
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();