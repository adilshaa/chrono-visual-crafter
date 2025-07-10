
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { toast } from "sonner";

export interface CounterExportOptions {
  canvas: HTMLCanvasElement;
  settings: {
    background: string;
    design: string;
    backgroundGradient?: string;
    customBackgroundColor?: string;
  };
  textSettings: {
    enabled: boolean;
    text: string;
    position: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  designSettings: any;
  duration: number;
  currentValue: number;
  formatNumber: (value: number) => string;
  fps?: number;
}

export class CounterExportManager {
  private static ffmpeg: FFmpeg | null = null;
  private static isFFmpegLoaded = false;

  static async initializeFFmpeg(): Promise<FFmpeg> {
    if (this.ffmpeg && this.isFFmpegLoaded) {
      return this.ffmpeg;
    }

    this.ffmpeg = new FFmpeg();
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    this.isFFmpegLoaded = true;
    return this.ffmpeg;
  }

  static async exportCounterOnly(options: CounterExportOptions): Promise<Blob> {
    const { canvas, settings, textSettings, designSettings, duration, currentValue, formatNumber, fps = 60 } = options;
    
    // Create a new canvas for counter-only export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d', { alpha: true });
    
    if (!ctx) {
      throw new Error('Could not get export canvas context');
    }

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Apply counter and text rendering logic similar to CounterPreview but without background
    this.renderCounterAndText(ctx, exportCanvas, settings, textSettings, designSettings, currentValue, formatNumber);

    // Create stream and record
    const stream = exportCanvas.captureStream(fps);
    
    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        reject(new Error('Recording failed'));
      };
      
      recorder.start(100);
      
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        stream.getTracks().forEach(track => track.stop());
      }, duration * 1000);
    });
  }

  static renderCounterAndText(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    settings: any,
    textSettings: any,
    designSettings: any,
    currentValue: number,
    formatNumber: (value: number) => string
  ) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply design effects
    this.applyDesignEffects(ctx, settings, designSettings, centerX, centerY);

    // Render counter
    ctx.save();
    ctx.font = `${settings.fontWeight} ${settings.fontSize}px ${settings.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = settings.textColor || '#FFFFFF';
    ctx.letterSpacing = `${settings.letterSpacing}px`;
    
    const counterText = formatNumber(currentValue);
    ctx.fillText(counterText, centerX, centerY);
    ctx.restore();

    // Render additional text if enabled
    if (textSettings.enabled && textSettings.text) {
      ctx.save();
      ctx.font = `${textSettings.fontSize}px ${textSettings.fontFamily}`;
      ctx.fillStyle = textSettings.color;
      ctx.globalAlpha = textSettings.opacity;
      
      let textX = centerX + textSettings.offsetX;
      let textY = centerY + textSettings.offsetY;
      
      ctx.fillText(textSettings.text, textX, textY);
      ctx.restore();
    }
  }

  static applyDesignEffects(
    ctx: CanvasRenderingContext2D,
    settings: any,
    designSettings: any,
    centerX: number,
    centerY: number
  ) {
    // Apply design-specific effects like glow, neon, etc.
    switch (settings.design) {
      case 'neon':
        ctx.shadowColor = designSettings.neonColor || '#00FFFF';
        ctx.shadowBlur = designSettings.neonIntensity || 10;
        break;
      case 'glow':
        ctx.shadowColor = designSettings.glowColor || '#FFFFFF';
        ctx.shadowBlur = designSettings.glowIntensity || 15;
        break;
      case 'fire':
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = designSettings.fireGlow || 10;
        break;
      default:
        ctx.shadowBlur = 0;
        break;
    }
  }

  static async exportGifWithFFmpeg(
    canvas: HTMLCanvasElement,
    options: CounterExportOptions,
    onProgress?: (progress: number) => void,
    onCancel?: () => boolean
  ): Promise<Blob> {
    const { duration, fps = 30 } = options;
    
    try {
      const ffmpeg = await this.initializeFFmpeg();
      
      // Generate frames
      const frameCount = Math.floor(duration * fps);
      const frames: Uint8Array[] = [];
      
      for (let i = 0; i < frameCount; i++) {
        if (onCancel && onCancel()) {
          throw new Error('Export cancelled');
        }
        
        const progress = (options.settings.endValue - options.settings.startValue) * (i / (frameCount - 1));
        const currentValue = options.settings.startValue + progress;
        
        // Update canvas with current frame
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render background if not transparent
        if (options.settings.background !== 'transparent') {
          if (options.settings.background === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            // Add gradient stops based on backgroundGradient
            gradient.addColorStop(0, '#2193b0');
            gradient.addColorStop(1, '#6dd5ed');
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = options.settings.background === 'white' ? '#FFFFFF' : '#000000';
          }
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Render counter and text
        this.renderCounterAndText(ctx, canvas, options.settings, options.textSettings, options.designSettings, currentValue, options.formatNumber);
        
        // Convert canvas to image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const rgbaData = new Uint8Array(imageData.data);
        frames.push(rgbaData);
        
        if (onProgress) {
          onProgress((i / frameCount) * 0.8); // 80% for frame generation
        }
      }
      
      // Convert frames to video using FFmpeg
      const inputFileName = 'input.rawvideo';
      const outputFileName = 'output.gif';
      
      // Write frames as raw video
      const frameSize = canvas.width * canvas.height * 4; // RGBA
      const videoData = new Uint8Array(frames.length * frameSize);
      
      for (let i = 0; i < frames.length; i++) {
        videoData.set(frames[i], i * frameSize);
      }
      
      await ffmpeg.writeFile(inputFileName, videoData);
      
      // Convert to GIF
      await ffmpeg.exec([
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${canvas.width}x${canvas.height}`,
        '-r', fps.toString(),
        '-i', inputFileName,
        '-vf', 'palettegen=reserve_transparent=1',
        '-y',
        'palette.png'
      ]);
      
      await ffmpeg.exec([
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${canvas.width}x${canvas.height}`,
        '-r', fps.toString(),
        '-i', inputFileName,
        '-i', 'palette.png',
        '-lavfi', 'paletteuse=alpha_threshold=128',
        '-y',
        outputFileName
      ]);
      
      if (onProgress) {
        onProgress(1); // 100% complete
      }
      
      const data = await ffmpeg.readFile(outputFileName);
      return new Blob([data], { type: 'image/gif' });
      
    } catch (error) {
      console.error('FFmpeg GIF export failed:', error);
      throw error;
    }
  }

  static async downloadCounterVideo(blob: Blob, filename?: string): Promise<void> {
    const finalFilename = filename || `counter-only-${Date.now()}.webm`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast.success(`Counter video downloaded: ${finalFilename}`);
  }

  static async downloadGif(blob: Blob, filename?: string): Promise<void> {
    const finalFilename = filename || `counter-animation-${Date.now()}.gif`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast.success(`GIF downloaded: ${finalFilename}`);
  }
}
