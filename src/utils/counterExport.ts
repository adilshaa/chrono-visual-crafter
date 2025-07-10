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
    startValue: number;
    endValue: number;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    textColor: string;
    speed: number;
    easing: string;
    prefix: string;
    suffix: string;
    separator: string;
    useFloatValues: boolean;
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
    const { canvas, settings, textSettings, designSettings, duration, formatNumber, fps = 60 } = options;
    
    // Create a new canvas for counter-only export with transparent background
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    const exportCtx = exportCanvas.getContext('2d', { alpha: true });
    if (!exportCtx) {
      throw new Error('Could not get export canvas context');
    }

    // Create MediaRecorder stream from the export canvas
    const stream = exportCanvas.captureStream(fps);
    
    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      
      // Use VP9 codec for transparency support
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 8000000, // High bitrate for quality
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        try {
          const blob = new Blob(chunks, { type: mimeType });
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
      
      // Animation variables
      const startTime = Date.now();
      const durationMs = duration * 1000;
      const frameInterval = 1000 / fps;
      let lastFrameTime = 0;
      
      // Animation loop
      const animateCounter = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        
        // Only render frame if enough time has passed
        if (elapsed - lastFrameTime >= frameInterval) {
          // Apply easing function
          let easedProgress = progress;
          switch (settings.easing) {
            case 'easeOut':
              easedProgress = 1 - Math.pow(1 - progress, 2);
              break;
            case 'easeIn':
              easedProgress = progress * progress;
              break;
            case 'bounce':
              if (progress < 0.5) {
                easedProgress = 4 * progress * progress;
              } else if (progress < 0.8) {
                easedProgress = 1 + (progress - 0.8) * 5;
              } else {
                easedProgress = 1 - 0.5 * Math.pow((progress - 1) * 2.5, 2);
              }
              break;
            default:
              easedProgress = progress;
          }
          
          // Calculate current counter value
          const currentValue = settings.startValue + easedProgress * (settings.endValue - settings.startValue);
          
          // Clear canvas with transparency
          exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          
          // Render counter and text with transparent background
          this.renderCounterAndText(exportCtx, exportCanvas, settings, textSettings, designSettings, currentValue, formatNumber);
          
          lastFrameTime = elapsed;
        }
        
        if (progress >= 1) {
          // Animation complete, stop recording after a short delay
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            stream.getTracks().forEach(track => track.stop());
          }, 200);
        } else {
          // Continue animation
          requestAnimationFrame(animateCounter);
        }
      };
      
      // Start animation
      requestAnimationFrame(animateCounter);
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
    const fontWeight = settings.fontWeight || 400;
    const fontFamily = this.getFontFamily(settings.fontFamily);
    ctx.font = `${fontWeight} ${settings.fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Apply letter spacing if needed
    if (settings.letterSpacing && settings.letterSpacing !== 0) {
      this.renderTextWithLetterSpacing(ctx, formatNumber(currentValue), centerX, centerY, settings);
    } else {
      // Apply design effects to counter text
      this.applyTextDesignEffects(ctx, formatNumber(currentValue), centerX, centerY, settings, designSettings);
    }
    
    ctx.restore();

    // Render additional text if enabled
    if (textSettings.enabled && textSettings.text) {
      ctx.save();
      ctx.font = `${textSettings.fontSize}px ${this.getFontFamily(textSettings.fontFamily)}`;
      ctx.fillStyle = textSettings.color;
      ctx.globalAlpha = textSettings.opacity;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let textX = centerX + textSettings.offsetX;
      let textY = centerY + textSettings.offsetY;
      
      // Apply same design effects to additional text
      this.applyTextDesignEffects(ctx, textSettings.text, textX, textY, settings, designSettings);
      
      ctx.restore();
    }
  }

  static getFontFamily(fontKey: string): string {
    const fontMap: Record<string, string> = {
      inter: '"Inter", sans-serif',
      mono: '"Roboto Mono", monospace',
      poppins: '"Poppins", sans-serif',
      orbitron: '"Orbitron", monospace',
      rajdhani: '"Rajdhani", sans-serif',
      exo: '"Exo 2", sans-serif',
      play: '"Play", sans-serif',
      russo: '"Russo One", sans-serif',
      audiowide: '"Audiowide", monospace',
      michroma: '"Michroma", monospace',
      roboto: '"Roboto", sans-serif',
      montserrat: '"Montserrat", sans-serif',
      arial: '"Arial", sans-serif',
    };

    return fontMap[fontKey] || '"Inter", sans-serif';
  }

  static renderTextWithLetterSpacing(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    settings: any
  ) {
    const letterSpacing = settings.letterSpacing || 0;
    let totalWidth = 0;

    // Calculate total width with spacing
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      totalWidth += charWidth + (i < text.length - 1 ? letterSpacing : 0);
    }

    // Draw each character with spacing
    let currentX = x - totalWidth / 2;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;

      ctx.fillStyle = settings.textColor || '#FFFFFF';
      ctx.fillText(char, currentX + charWidth / 2, y);

      currentX += charWidth + letterSpacing;
    }
  }

  static applyTextDesignEffects(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    settings: any,
    designSettings: any
  ) {
    switch (settings.design) {
      case 'neon':
        const neonColor = designSettings.neonColor || '#00FFFF';
        const intensity = designSettings.neonIntensity || 10;

        // Create neon effect with multiple layers
        ctx.save();
        
        // Outer glow
        ctx.globalAlpha = 0.4;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = intensity * 2;
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);

        // Inner fill
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = intensity;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x, y);

        // Core highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = neonColor;
        ctx.fillText(text, x, y);
        
        ctx.restore();
        break;

      case 'glow':
        const glowColor = designSettings.glowColor || '#FFFFFF';
        const glowIntensity = designSettings.glowIntensity || 15;

        ctx.save();
        
        // Multiple glow layers
        for (let i = 0; i < 3; i++) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowIntensity + i * 5;
          ctx.fillStyle = glowColor;
          ctx.fillText(text, x, y);
        }
        
        ctx.restore();
        break;

      case 'gradient':
        const gradient = ctx.createLinearGradient(x - 50, y - 25, x + 50, y + 25);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#4ECDC4');
        gradient.addColorStop(1, '#45B7D1');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
        break;

      case 'fire':
        const fireGradient = ctx.createLinearGradient(x, y - 25, x, y + 25);
        fireGradient.addColorStop(0, '#FF4444');
        fireGradient.addColorStop(0.5, '#FF8800');
        fireGradient.addColorStop(1, '#FFFF00');
        ctx.fillStyle = fireGradient;
        
        // Add fire glow
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = designSettings.fireGlow || 10;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        break;

      case 'rainbow':
        const rainbowGradient = ctx.createLinearGradient(x - 50, y, x + 50, y);
        rainbowGradient.addColorStop(0, '#FF0000');
        rainbowGradient.addColorStop(0.17, '#FF8800');
        rainbowGradient.addColorStop(0.33, '#FFFF00');
        rainbowGradient.addColorStop(0.5, '#00FF00');
        rainbowGradient.addColorStop(0.67, '#0088FF');
        rainbowGradient.addColorStop(0.83, '#8800FF');
        rainbowGradient.addColorStop(1, '#FF0088');
        ctx.fillStyle = rainbowGradient;
        ctx.fillText(text, x, y);
        break;

      case 'chrome':
        const chromeGradient = ctx.createLinearGradient(x, y - 25, x, y + 25);
        chromeGradient.addColorStop(0, '#FFFFFF');
        chromeGradient.addColorStop(0.5, '#CCCCCC');
        chromeGradient.addColorStop(1, '#999999');
        ctx.fillStyle = chromeGradient;
        ctx.fillText(text, x, y);
        break;

      default:
        ctx.fillStyle = settings.textColor || '#FFFFFF';
        ctx.fillText(text, x, y);
        break;
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
    const { duration, fps = 30, settings, textSettings, designSettings, formatNumber } = options;
    
    try {
      const ffmpeg = await this.initializeFFmpeg();
      
      // Generate frames
      const frameCount = Math.floor(duration * fps);
      const frames: Uint8Array[] = [];
      
      // Create a temporary canvas for frame generation
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = canvas.width;
      frameCanvas.height = canvas.height;
      const frameCtx = frameCanvas.getContext('2d', { alpha: true });
      
      if (!frameCtx) {
        throw new Error('Could not get frame canvas context');
      }
      
      for (let i = 0; i < frameCount; i++) {
        if (onCancel && onCancel()) {
          throw new Error('Export cancelled');
        }
        
        const progress = i / (frameCount - 1);
        
        // Apply easing function
        let easedProgress = progress;
        switch (settings.easing) {
          case 'easeOut':
            easedProgress = 1 - Math.pow(1 - progress, 2);
            break;
          case 'easeIn':
            easedProgress = progress * progress;
            break;
          case 'bounce':
            if (progress < 0.5) {
              easedProgress = 4 * progress * progress;
            } else if (progress < 0.8) {
              easedProgress = 1 + (progress - 0.8) * 5;
            } else {
              easedProgress = 1 - 0.5 * Math.pow((progress - 1) * 2.5, 2);
            }
            break;
          default:
            easedProgress = progress;
        }
        
        const currentValue = settings.startValue + easedProgress * (settings.endValue - settings.startValue);
        
        // Clear frame canvas
        frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
        
        // Render background if not transparent
        if (settings.background !== 'transparent') {
          if (settings.background === 'gradient' && settings.backgroundGradient) {
            const gradient = frameCtx.createLinearGradient(0, 0, frameCanvas.width, frameCanvas.height);
            gradient.addColorStop(0, '#2193b0');
            gradient.addColorStop(1, '#6dd5ed');
            frameCtx.fillStyle = gradient;
          } else if (settings.background === 'custom' && settings.customBackgroundColor) {
            frameCtx.fillStyle = settings.customBackgroundColor;
          } else {
            frameCtx.fillStyle = settings.background === 'white' ? '#FFFFFF' : '#000000';
          }
          frameCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
        }
        
        // Render counter and text
        this.renderCounterAndText(frameCtx, frameCanvas, settings, textSettings, designSettings, currentValue, formatNumber);
        
        // Convert canvas to image data
        const imageData = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
        const rgbaData = new Uint8Array(imageData.data);
        frames.push(rgbaData);
        
        if (onProgress) {
          onProgress((i / frameCount) * 0.8); // 80% for frame generation
        }
      }
      
      // Convert frames to GIF using FFmpeg
      const inputFileName = 'input.rawvideo';
      const outputFileName = 'output.gif';
      
      // Write frames as raw video
      const frameSize = frameCanvas.width * frameCanvas.height * 4; // RGBA
      const videoData = new Uint8Array(frames.length * frameSize);
      
      for (let i = 0; i < frames.length; i++) {
        videoData.set(frames[i], i * frameSize);
      }
      
      await ffmpeg.writeFile(inputFileName, videoData);
      
      // Convert to GIF
      await ffmpeg.exec([
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${frameCanvas.width}x${frameCanvas.height}`,
        '-r', fps.toString(),
        '-i', inputFileName,
        '-vf', 'palettegen=reserve_transparent=1',
        '-y',
        'palette.png'
      ]);
      
      await ffmpeg.exec([
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${frameCanvas.width}x${frameCanvas.height}`,
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
