'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, PauseCircle, Upload, Image as ImageIcon, Music, ZoomIn, ZoomOut, Clock, Sun, Moon, Rewind, RotateCcw, GripVertical, ChevronUp, ChevronDown, Crosshair, FastForward, Maximize, ChevronRight, ChevronLeft } from 'lucide-react'
import { ImageFilters, Filter, applyFilter } from './image-filters'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { applyEffect, EffectParams } from './effects'

type Effect = 'none' | 'flash' | 'pulse' | 'spin' | 'vhs' | 'rotate' | 'vaporwave' | 'chromatic-aberration' | 'crash-zoom' | 'slow-zoom' | 'green-screen' | 'random'

type ImageItem = {
  file: File
  effect: Effect
  filter: Filter
  duration: number
  startTime: number
  effectParams: EffectParams
}

// Add this type at the top of the file, near other type definitions
type AudioFileWithDuration = File & { duration?: number };

const useAudio = (audioFile: File | null) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioFile) {
      const newAudio = new Audio(URL.createObjectURL(audioFile))
      setAudio(newAudio)
    }
  }, [audioFile])

  return audio
}

// Add this custom Switch component at the top of the file, after the imports
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
  <button
    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
      checked ? 'bg-blue-600' : 'bg-gray-200'
    }`}
    onClick={() => onCheckedChange(!checked)}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export function VideoEditorComponent() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [audioFile, setAudioFile] = useState<AudioFileWithDuration | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastRenderedTimeRef = useRef<number>(0)
  const audio = useAudio(audioFile)
  const [followPlayhead, setFollowPlayhead] = useState(true)  // Changed this line
  const timelineRef = useRef<HTMLDivElement>(null)
  const audioCanvasRef = useRef<HTMLCanvasElement>(null)
  const [timelineScale, setTimelineScale] = useState(100); // pixels per second
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const audio = new Audio(URL.createObjectURL(file));
      audio.onloadedmetadata = () => {
        const fileWithDuration = Object.assign(file, { duration: audio.duration });
        setAudioFile(fileWithDuration);
      };
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newImages = Array.from(event.target.files).map((file, index) => ({
        file,
        effect: 'none' as Effect,
        filter: 'none' as Filter,
        duration: 5,
        startTime: index * 5,
        effectParams: {}
      }))
      setImages([...images, ...newImages])
    }
  }

  const updateImageEffect = (index: number, effect: Effect) => {
    const updatedImages = [...images]
    updatedImages[index].effect = effect
    updatedImages[index].effectParams = getDefaultEffectParams(effect)
    setImages(updatedImages)
  }

  const updateEffectParam = (index: number, param: string, value: number | string) => {
    const updatedImages = [...images]
    updatedImages[index].effectParams[param] = value
    setImages(updatedImages)
  }

  const getDefaultEffectParams = (effect: Effect): Record<string, number | string> => {
    switch (effect) {
      case 'flash':
        return { intensity: 1, duration: 0.5 }
      case 'pulse':
        return { frequency: 1, amplitude: 0.5 }
      case 'spin':
        return { speed: 1, direction: 'clockwise' }
      case 'vhs':
        return { noiseIntensity: 0.5, scanLineOpacity: 0.5 }
      case 'rotate':
        return { angle: 0 }
      case 'vaporwave':
        return { colorIntensity: 1, glitchFrequency: 0.5 }
      case 'chromatic-aberration':
        return { intensity: 0.5 }
      case 'crash-zoom':
        return { direction: 'in', duration: 0.5, scale: 2 }
      case 'slow-zoom':
        return { startScale: 1, endScale: 1.5 }
      case 'green-screen':
        return { tolerance: 0.5, feather: 0.1 }
      default:
        return {}
    }
  }

  const updateImageDuration = (index: number, newDuration: number, fromStart: boolean) => {
    const newImages = [...images];
    const oldDuration = newImages[index].duration;
    newImages[index].duration = Math.max(0.1, newDuration); // Ensure duration is at least 0.1 seconds

    if (fromStart) {
      const difference = oldDuration - newImages[index].duration;
      newImages[index].startTime += difference;
    }

    // Recalculate start times for all subsequent images
    for (let i = index + 1; i < newImages.length; i++) {
      newImages[i].startTime = newImages[i - 1].startTime + newImages[i - 1].duration;
    }

    setImages(newImages);
  };

  const updateImageStartTime = (index: number, startTime: number) => {
    const updatedImages = [...images]
    updatedImages[index].startTime = startTime
    // Update start times for all subsequent images
    for (let i = index + 1; i < updatedImages.length; i++) {
      updatedImages[i].startTime = updatedImages[i - 1].startTime + updatedImages[i - 1].duration
    }
    setImages(updatedImages)
  }

  const updateImageFilter = (index: number, filter: Filter) => {
    const updatedImages = [...images]
    updatedImages[index].filter = filter
    setImages(updatedImages)
  }

  const renderPreview = (time: number) => {
    if (!canvasRef.current || !offscreenCanvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    const offscreenCtx = offscreenCanvasRef.current.getContext('2d')
    if (!ctx || !offscreenCtx) return

    // Only render if the time has changed significantly
    if (Math.abs(time - lastRenderedTimeRef.current) < 0.016) { // ~60fps
      return
    }

    offscreenCtx.clearRect(0, 0, offscreenCanvasRef.current.width, offscreenCanvasRef.current.height)

    for (const image of images) {
      if (time >= image.startTime && time < image.startTime + image.duration) {
        const img = new Image()
        img.onload = () => {
          // Center the image
          const scale = Math.max(offscreenCanvasRef.current!.width / img.width, offscreenCanvasRef.current!.height / img.height)
          const x = (offscreenCanvasRef.current!.width - img.width * scale) / 2
          const y = (offscreenCanvasRef.current!.height - img.height * scale) / 2

          offscreenCtx.save()
          
          const progress = (time - image.startTime) / image.duration

          // Apply the effect
          offscreenCtx.translate(offscreenCanvasRef.current!.width / 2, offscreenCanvasRef.current!.height / 2)
          applyEffect(offscreenCtx, image.effect, image.effectParams, progress)

          // Draw the image
          offscreenCtx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale)

          // Apply the filter
          applyFilter(offscreenCtx, image.filter)

          offscreenCtx.restore()

          // Copy the offscreen canvas to the main canvas
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(offscreenCanvasRef.current!, 0, 0)

          lastRenderedTimeRef.current = time
        }
        img.src = URL.createObjectURL(image.file)
        break
      }
    }
  }

  useEffect(() => {
    if (canvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
      offscreenCanvasRef.current.width = canvasRef.current.width
      offscreenCanvasRef.current.height = canvasRef.current.height
    }
  }, [])

  useEffect(() => {
    renderPreview(currentTime)
  }, [currentTime, images])

  const playPreview = () => {
    if (audio) {
      audio.currentTime = currentTime
      audio.play()
      const animatePreview = () => {
        if (audio.currentTime >= timelineDuration) {
          pausePreview()
          setCurrentTime(0)
          audio.currentTime = 0
        } else {
          setCurrentTime(audio.currentTime)
          renderPreview(audio.currentTime)
          animationFrameRef.current = requestAnimationFrame(animatePreview)
        }
      }
      animationFrameRef.current = requestAnimationFrame(animatePreview)
    }
  }

  const pausePreview = () => {
    if (audio) {
      audio.pause()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const rewindPreview = () => {
    const newTime = Math.max(0, currentTime - 5) // Rewind by 5 seconds
    setCurrentTime(newTime)
    if (audio) {
      audio.currentTime = newTime
    }
  }

  const rewindToStart = () => {
    setCurrentTime(0)
    if (audio) {
      audio.currentTime = 0
    }
  }

  const totalDuration = images.reduce((sum, img) => Math.max(sum, img.startTime + img.duration), 0)
  const timelineDuration = audioFile && audioFile.duration ? audioFile.duration : totalDuration;

  const forwardPreview = () => {
    const newTime = Math.min(currentTime + 5, timelineDuration) // Forward by 5 seconds
    setCurrentTime(newTime)
    if (audio) {
      audio.currentTime = newTime
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const themeClasses = isDarkMode
    ? "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-gray-300"
    : "bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100 text-gray-800"

  const cardClasses = isDarkMode
    ? "bg-gray-800/80 border-none"
    : "bg-white/80 border border-gray-200"

  const headerClasses = isDarkMode ? "text-blue-300" : "text-blue-600"

  const inputClasses = isDarkMode
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-100 text-gray-800"

  const buttonClasses = isDarkMode
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-blue-500 hover:bg-blue-600 text-white"

  const zoomIn = () => {
    setTimelineScale(prev => Math.min(prev * 1.2, 500)); // Limit max zoom
  };

  const zoomOut = () => {
    setTimelineScale(prev => Math.max(prev / 1.2, 20)); // Limit min zoom
  };

  const zoomToFit = () => {
    if (timelineRef.current) {
      const containerWidth = timelineRef.current.clientWidth;
      const newScale = containerWidth / timelineDuration;
      setTimelineScale(newScale);
    }
  };

  // Add this useEffect hook to call zoomToFit on mount and when timelineDuration changes
  useEffect(() => {
    zoomToFit();
  }, [timelineDuration]);

  const expandImageDuration = (index: number, amount: number) => {
    const newImages = [...images];
    newImages[index].duration += amount;

    // Recalculate start times for all subsequent images
    for (let i = index + 1; i < newImages.length; i++) {
      newImages[i].startTime = newImages[i - 1].startTime + newImages[i - 1].duration;
    }

    setImages(newImages);
  };

  const fitImagesToAudio = () => {
    if (audioFile && audioFile.duration && images.length > 0) {
      const totalAudioDuration = audioFile.duration;
      const imageDuration = totalAudioDuration / images.length;
      
      const newImages = images.map((image, index) => ({
        ...image,
        duration: imageDuration,
        startTime: index * imageDuration
      }));

      setImages(newImages);
    }
  };

  const Timeline = () => {
    useEffect(() => {
      if (followPlayhead && timelineRef.current) {
        const scrollPosition = currentTime * timelineScale - timelineRef.current.clientWidth / 2;
        timelineRef.current.scrollLeft = scrollPosition;
      }
    }, [currentTime, followPlayhead, timelineScale]);

    useEffect(() => {
      if (audioFile && audioCanvasRef.current) {
        drawAudioWaveform(audioFile, audioCanvasRef.current);
      }
    }, [audioFile]);

    // Add this useEffect hook to call zoomToFit when the timeline ref is available
    useEffect(() => {
      if (timelineRef.current) {
        zoomToFit();
      }
    }, [timelineRef.current]);

    const drawAudioWaveform = async (file: AudioFileWithDuration, canvas: HTMLCanvasElement) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const audioDuration = audioBuffer.duration
      canvas.width = Math.max(totalDuration, audioDuration) * timelineScale
      const width = canvas.width
      const height = canvas.height
      const data = audioBuffer.getChannelData(0)
      const step = Math.ceil(data.length / width)

      ctx.fillStyle = isDarkMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(37, 99, 235, 0.5)'
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < width; i++) {
        const sliceStart = Math.floor(i * step)
        const sliceEnd = Math.floor((i + 1) * step)
        let max = 0
        for (let j = sliceStart; j < sliceEnd; j++) {
          const absolute = Math.abs(data[j])
          if (absolute > max) max = absolute
        }
        const barHeight = max * height
        ctx.fillRect(i, (height - barHeight) / 2, 1, barHeight)
      }
    }

    const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left + timelineRef.current.scrollLeft;
        const clickedTime = offsetX / timelineScale;
        setCurrentTime(Math.min(clickedTime, timelineDuration));
        if (audio) {
          audio.currentTime = Math.min(clickedTime, timelineDuration);
        }
      }
    };

    const handleDrag = (index: number, fromStart: boolean) => (event: any, info: any) => {
      const dragDistance = info.offset.x / timelineScale;
      const currentImage = images[index];
      const newDuration = fromStart
        ? currentImage.duration - dragDistance
        : currentImage.duration + dragDistance;
      updateImageDuration(index, newDuration, fromStart);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Timeline</span>
          <div className="flex items-center space-x-2">
            <Button onClick={zoomOut} size="icon" variant="outline" className={buttonClasses}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button onClick={zoomIn} size="icon" variant="outline" className={buttonClasses}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button onClick={zoomToFit} size="icon" variant="outline" className={buttonClasses}>
              <Maximize className="w-4 h-4" />
            </Button>
            <Button 
              onClick={fitImagesToAudio} 
              size="icon" 
              variant="outline" 
              className={buttonClasses}
              disabled={!audioFile || images.length === 0}
              title="Fit images to audio duration"
            >
              <Music className="w-4 h-4" />
            </Button>
            <Switch
              checked={followPlayhead}
              onCheckedChange={setFollowPlayhead}
            />
            <Label htmlFor="follow-playhead" className="text-sm">Follow Playhead</Label>
          </div>
        </div>
        <div 
          ref={timelineRef} 
          className="relative h-32 overflow-x-auto cursor-pointer" 
          onClick={handleTimelineClick}
        >
          <div 
            className="absolute top-0 left-0 h-full" 
            style={{ width: `${timelineDuration * timelineScale}px` }}
          >
            {images.map((image, index) => (
              <motion.div
                key={index}
                className={`absolute h-16 rounded ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-400'
                } ${
                  selectedImageIndex === index ? 'border-2 border-green-500' : ''
                }`}
                style={{
                  left: `${image.startTime * timelineScale}px`,
                  width: `${image.duration * timelineScale}px`,
                  display: image.startTime < timelineDuration ? 'block' : 'none',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(index);
                }}
              >
                <img
                  src={URL.createObjectURL(image.file)}
                  alt={`Thumbnail ${index}`}
                  className="h-full w-full object-cover rounded"
                />
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDrag={handleDrag(index, true)}
                >
                  <svg width="6" height="14" viewBox="0 0 6 14" className="absolute left-0 top-1/2 -translate-y-1/2">
                    <path fillRule="evenodd" d="M1 -4.37114e-08C1.55228 -1.95703e-08 2 0.447715 2 1L2 13C2 13.5523 1.55228 14 0.999999 14C0.447715 14 -5.92389e-07 13.5523 -5.68248e-07 13L-4.37114e-08 1C-1.95703e-08 0.447715 0.447715 -6.78525e-08 1 -4.37114e-08Z" fill="currentColor"></path>
                    <path fillRule="evenodd" d="M5 -4.37114e-08C5.55228 -1.95703e-08 6 0.447715 6 1L6 13C6 13.5523 5.55228 14 5 14C4.44771 14 4 13.5523 4 13L4 1C4 0.447715 4.44772 -6.78525e-08 5 -4.37114e-08Z" fill="currentColor"></path>
                  </svg>
                </motion.div>
                <motion.div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDrag={handleDrag(index, false)}
                >
                  <svg width="6" height="14" viewBox="0 0 6 14" className="absolute right-0 top-1/2 -translate-y-1/2">
                    <path fillRule="evenodd" d="M1 -4.37114e-08C1.55228 -1.95703e-08 2 0.447715 2 1L2 13C2 13.5523 1.55228 14 0.999999 14C0.447715 14 -5.92389e-07 13.5523 -5.68248e-07 13L-4.37114e-08 1C-1.95703e-08 0.447715 0.447715 -6.78525e-08 1 -4.37114e-08Z" fill="currentColor"></path>
                    <path fillRule="evenodd" d="M5 -4.37114e-08C5.55228 -1.95703e-08 6 0.447715 6 1L6 13C6 13.5523 5.55228 14 5 14C4.44771 14 4 13.5523 4 13L4 1C4 0.447715 4.44772 -6.78525e-08 5 -4.37114e-08Z" fill="currentColor"></path>
                  </svg>
                </motion.div>
              </motion.div>
            ))}
            <div
              className={`absolute top-0 w-0.5 h-full bg-red-500`}
              style={{ left: `${currentTime * timelineScale}px` }}
            />
            <canvas
              ref={audioCanvasRef}
              className="absolute bottom-0 left-0 w-full h-16"
              height={64}
            />
          </div>
        </div>
        {selectedImageIndex !== null && (
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Button
              onClick={() => expandImageDuration(selectedImageIndex, -0.1)}
              size="sm"
              variant="outline"
              className={buttonClasses}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Duration: {images[selectedImageIndex].duration.toFixed(1)}s
            </span>
            <Button
              onClick={() => expandImageDuration(selectedImageIndex, 0.1)}
              size="sm"
              variant="outline"
              className={buttonClasses}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedImages = Array.from(images);
    const [reorderedItem] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, reorderedItem);

    // Recalculate start times
    let currentStartTime = 0;
    const updatedImages = reorderedImages.map((image) => {
      const updatedImage = { ...image, startTime: currentStartTime };
      currentStartTime += image.duration;
      return updatedImage;
    });

    setImages(updatedImages);
  }

  const exportVideo = async () => {
    const ffmpeg = new FFmpeg()
    await ffmpeg.load()

    // Write images to FFmpeg virtual file system
    for (let i = 0; i < images.length; i++) {
      const imageData = await fetchFile(images[i].file)
      await ffmpeg.writeFile(`image${i}.png`, imageData)
    }

    // Create FFmpeg command
    let command = '-framerate 30 '
    for (let i = 0; i < images.length; i++) {
      command += `-loop 1 -t ${images[i].duration} -i image${i}.png `
    }
    command += '-filter_complex "'
    for (let i = 0; i < images.length; i++) {
      command += `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fade=t=in:st=0:d=1,fade=t=out:st=${images[i].duration - 1}:d=1[v${i}]; `
    }
    for (let i = 0; i < images.length; i++) {
      command += `[v${i}]`
    }
    command += `concat=n=${images.length}:v=1:a=0,format=yuv420p[v]" -map "[v]" output.mp4`

    // Run FFmpeg command
    await ffmpeg.exec(command.split(' '))

    // Read the output file
    const data = await ffmpeg.readFile('output.mp4')

    // Create a download link
    const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.mp4'
    a.click()
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    if (direction === 'up' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'down' && index < newImages.length - 1) {
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    }

    // Recalculate start times
    let currentStartTime = 0;
    const updatedImages = newImages.map((image) => {
      const updatedImage = { ...image, startTime: currentStartTime };
      currentStartTime += image.duration;
      return updatedImage;
    });

    setImages(updatedImages);
  };

  const renderEffectParams = (image: ImageItem, index: number) => {
    switch (image.effect) {
      case 'flash':
        return (
          <>
            <Slider
              value={[image.effectParams.intensity as number]}
              onValueChange={(value) => updateEffectParam(index, 'intensity', value[0])}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <span>Intensity: {image.effectParams.intensity}</span>
          </>
        )
      // Add cases for other effects here
      default:
        return null
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen p-8 ${themeClasses}`}>
      <div className={`container mx-auto backdrop-blur-sm rounded-xl shadow-lg p-8 ${cardClasses}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${headerClasses}`}>Lumina Flow AI Video Editor</h1>
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 space-y-8">
            <Card className={cardClasses}>
              <CardHeader>
                <CardTitle className={headerClasses}>Upload Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="audio-upload" className="flex items-center space-x-2 cursor-pointer">
                    <Music className="w-5 h-5" />
                    <span>Upload Audio</span>
                  </Label>
                  <Input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioUpload} className={`mt-2 ${inputClasses}`} />
                  {audioFile && <p className="text-sm mt-1">Audio uploaded: {audioFile.name}</p>}
                </div>
                <div>
                  <Label htmlFor="image-upload" className="flex items-center space-x-2 cursor-pointer">
                    <ImageIcon className="w-5 h-5" />
                    <span>Upload Images</span>
                  </Label>
                  <Input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageUpload} className={`mt-2 ${inputClasses}`} />
                </div>
              </CardContent>
            </Card>

            <Card className={cardClasses}>
              <CardHeader>
                <CardTitle className={headerClasses}>Edit Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Drag and drop or use arrows to reorder images</p>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="images">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 max-h-96 overflow-y-auto">
                        {images.map((image, index) => (
                          <Draggable key={`image-${index}`} draggableId={`image-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center space-x-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                              >
                                <div className="flex flex-col items-center mr-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => moveImage(index, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </Button>
                                  <div {...provided.dragHandleProps} className="cursor-move my-1">
                                    <GripVertical className="w-6 h-6" />
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => moveImage(index, 'down')}
                                    disabled={index === images.length - 1}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </div>
                                <img src={URL.createObjectURL(image.file)} alt={`Image ${index}`} className="w-20 h-20 object-cover rounded" />
                                <div className="flex-grow space-y-2">
                                  <Select value={image.effect} onValueChange={(value) => updateImageEffect(index, value as Effect)}>
                                    <SelectTrigger className={inputClasses}>
                                      <SelectValue placeholder="Effect" />
                                    </SelectTrigger>
                                    <SelectContent className={inputClasses}>
                                      <SelectItem value="none">None</SelectItem>
                                      <SelectItem value="flash">Flash</SelectItem>
                                      <SelectItem value="pulse">Pulse</SelectItem>
                                      <SelectItem value="spin">Spin</SelectItem>
                                      <SelectItem value="vhs">VHS</SelectItem>
                                      <SelectItem value="rotate">Rotate</SelectItem>
                                      <SelectItem value="vaporwave">Vaporwave</SelectItem>
                                      <SelectItem value="chromatic-aberration">Chromatic Aberration</SelectItem>
                                      <SelectItem value="crash-zoom">Crash Zoom</SelectItem>
                                      <SelectItem value="slow-zoom">Slow Zoom</SelectItem>
                                      <SelectItem value="green-screen">Green Screen</SelectItem>
                                      <SelectItem value="random">Random</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {renderEffectParams(image, index)}
                                  <ImageFilters
                                    filter={image.filter}
                                    onFilterChange={(filter) => updateImageFilter(index, filter)}
                                    inputClasses={inputClasses}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <Input
                                      type="number"
                                      value={image.startTime}
                                      onChange={(e) => updateImageStartTime(index, parseFloat(e.target.value))}
                                      min={0}
                                      step={0.1}
                                      className={`w-20 ${inputClasses}`}
                                    />
                                    <span>to</span>
                                    <Input
                                      type="number"
                                      value={image.startTime + image.duration}
                                      onChange={(e) => updateImageDuration(index, parseFloat(e.target.value) - image.startTime)}
                                      min={image.startTime + 0.1}
                                      step={0.1}
                                      className={`w-20 ${inputClasses}`}
                                    />
                                    <span>s</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Card className={cardClasses}>
              <CardHeader>
                <CardTitle className={headerClasses}>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <canvas ref={canvasRef} width={640} height={360} className={`w-full h-auto border rounded-lg shadow-lg ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                      <Button onClick={rewindToStart} size="icon" variant="secondary" className={buttonClasses}>
                        <RotateCcw className="w-6 h-6" />
                        <span className="sr-only">Rewind to Start</span>
                      </Button>
                      <Button onClick={rewindPreview} size="icon" variant="secondary" className={buttonClasses}>
                        <Rewind className="w-6 h-6" />
                        <span className="sr-only">Rewind</span>
                      </Button>
                      <Button onClick={playPreview} size="icon" variant="secondary" className={buttonClasses}>
                        <PlayCircle className="w-6 h-6" />
                        <span className="sr-only">Play</span>
                      </Button>
                      <Button onClick={pausePreview} size="icon" variant="secondary" className={buttonClasses}>
                        <PauseCircle className="w-6 h-6" />
                        <span className="sr-only">Pause</span>
                      </Button>
                      <Button onClick={forwardPreview} size="icon" variant="secondary" className={buttonClasses}>
                        <FastForward className="w-6 h-6" />
                        <span className="sr-only">Forward</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={(value) => setCurrentTime(value[0])}
                      max={timelineDuration}
                      step={0.1}
                      className="flex-grow"
                    />
                    <span className="text-sm font-medium w-32">
                      {formatTime(currentTime)} / {formatTime(timelineDuration)}
                    </span>
                  </div>
                  <Timeline />
                  <Button onClick={exportVideo} className={buttonClasses}>
                    Export Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}