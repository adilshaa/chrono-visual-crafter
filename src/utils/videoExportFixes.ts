import { toast } from "sonner";

export interface VideoExportOptions {
  canvas: HTMLCanvasElement;
  settings: {
    background: string;
    design: string;
    backgroundGradient?: string;
    customBackgroundColor?: string;
  };
  duration: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

export class VideoExportManager {
  private static readonly CODEC_PREFERENCES = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus', 
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4;codecs=h264,aac',
    'video/mp4'
  ];

  private static readonly QUALITY_SETTINGS = {
    low: { videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 },
    medium: { videoBitsPerSecond: 5000000, audioBitsPerSecond: 192000 },
    high: { videoBitsPerSecond: 8000000, audioBitsPerSecond: 256000 },
    ultra: { videoBitsPerSecond: 15000000, audioBitsPerSecond: 320000 }
  };

  static getSupportedMimeType(): string {
    for (const mimeType of this.CODEC_PREFERENCES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        console.log('Using codec:', mimeType);
        return mimeType;
      }
    }
    
    console.warn('No preferred codecs supported, falling back to default');
    return 'video/webm';
  }

  static getRecorderOptions(
    hasTransparency: boolean, 
    hasEffects: boolean, 
    quality: 'low' | 'medium' | 'high' | 'ultra' = 'high'
  ): MediaRecorderOptions {
    const mimeType = this.getSupportedMimeType();
    const qualitySettings = this.QUALITY_SETTINGS[quality];
    
    const options: MediaRecorderOptions = {
      mimeType,
      ...qualitySettings
    };

    // Increase bitrate for transparency and effects
    if (hasTransparency) {
      options.videoBitsPerSecond = (options.videoBitsPerSecond || 8000000) * 1.5;
    }
    
    if (hasEffects) {
      options.videoBitsPerSecond = (options.videoBitsPerSecond || 8000000) * 1.2;
    }

    return options;
  }

  static setupCanvasForExport(canvas: HTMLCanvasElement, settings: any): void {
    const ctx = canvas.getContext('2d', { 
      alpha: settings.background === 'transparent',
      premultipliedAlpha: false,
      preserveDrawingBuffer: true
    });

    if (!ctx) return;

    // Set canvas size to ensure crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Configure context for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textRenderingOptimization = 'optimizeQuality';
  }

  static validateEffectBoundaries(canvas: HTMLCanvasElement, settings: any): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Check if effects are properly contained within canvas bounds
    const hasGlowEffects = ['neon', 'glow'].includes(settings.design);
    
    if (hasGlowEffects) {
      // Ensure glow effects don't exceed canvas boundaries
      const glowRadius = settings.designSettings?.glowIntensity || 15;
      const margin = glowRadius * 2;
      
      if (canvas.width < margin || canvas.height < margin) {
        console.warn('Canvas too small for glow effects, effects may be clipped');
        return false;
      }
    }

    return true;
  }

  static async createOptimizedStream(
    canvas: HTMLCanvasElement, 
    fps: number = 60
  ): Promise<MediaStream> {
    // Validate canvas state
    if (!canvas.getContext('2d')) {
      throw new Error('Canvas context not available');
    }

    try {
      // Create stream with specified frame rate
      const stream = canvas.captureStream(fps);
      
      // Verify stream tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks in canvas stream');
      }

      // Configure video track settings
      const videoTrack = videoTracks[0];
      const capabilities = videoTrack.getCapabilities();
      
      if (capabilities.frameRate) {
        await videoTrack.applyConstraints({
          frameRate: { ideal: fps, max: fps }
        });
      }

      return stream;
    } catch (error) {
      console.error('Error creating optimized stream:', error);
      throw error;
    }
  }

  static async exportWithAlphaChannel(
    canvas: HTMLCanvasElement,
    options: VideoExportOptions
  ): Promise<Blob> {
    const { settings, duration, fps = 60, quality = 'high' } = options;
    
    // Setup canvas for optimal export
    this.setupCanvasForExport(canvas, settings);
    
    // Validate effect boundaries
    if (!this.validateEffectBoundaries(canvas, settings)) {
      toast.warning('Effects may be clipped in export due to canvas size');
    }

    const hasTransparency = settings.background === 'transparent';
    const hasEffects = ['neon', 'glow', 'fire', 'rainbow'].includes(settings.design);
    
    // Get optimized recorder options
    const recorderOptions = this.getRecorderOptions(hasTransparency, hasEffects, quality);
    
    // Create optimized stream
    const stream = await this.createOptimizedStream(canvas, fps);
    
    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, recorderOptions);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: recorderOptions.mimeType });
          
          // Validate blob
          if (blob.size === 0) {
            reject(new Error('Generated video blob is empty'));
            return;
          }
          
          console.log(`Video exported: ${blob.size} bytes, type: ${blob.type}`);
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        reject(new Error('Recording failed'));
      };
      
      // Start recording
      recorder.start(100); // Collect data every 100ms
      
      // Stop recording after duration
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }, duration * 1000);
    });
  }

  static async validateExportedVideo(blob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(blob);
      
      video.onloadedmetadata = () => {
        const isValid = video.duration > 0 && video.videoWidth > 0 && video.videoHeight > 0;
        URL.revokeObjectURL(url);
        resolve(isValid);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      video.src = url;
    });
  }

  static getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/ogg': 'ogv'
    };
    
    for (const [type, ext] of Object.entries(extensions)) {
      if (mimeType.includes(type)) {
        return ext;
      }
    }
    
    return 'webm'; // Default fallback
  }

  static async downloadVideo(blob: Blob, filename?: string): Promise<void> {
    // Validate video before download
    const isValid = await this.validateExportedVideo(blob);
    if (!isValid) {
      throw new Error('Exported video is invalid or corrupted');
    }
    
    const extension = this.getFileExtension(blob.type);
    const finalFilename = filename || `counter-animation-${Date.now()}.${extension}`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast.success(`Video downloaded: ${finalFilename}`);
  }
}