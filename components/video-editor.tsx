'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, PauseCircle, Upload, Image as ImageIcon, Music, ZoomIn, ZoomOut, Clock, Sun, Moon, Rewind, RotateCcw } from 'lucide-react'
import { ImageFilters, Filter, applyFilter } from './image-filters'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

type Effect = 'none' | 'zoom-in' | 'zoom-out' | 'fade'

type ImageItem = {
  file: File
  effect: Effect
  filter: Filter
  duration: number
  startTime: number
}

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

export function VideoEditorComponent() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [images, setImages] = useState<ImageItem[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audio = useAudio(audioFile)

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0])
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newImages = Array.from(event.target.files).map((file, index) => ({
        file,
        effect: 'none' as Effect,
        filter: 'none' as Filter,
        duration: 5,
        startTime: index * 5
      }))
      setImages([...images, ...newImages])
    }
  }

  const updateImageEffect = (index: number, effect: Effect) => {
    const updatedImages = [...images]
    updatedImages[index].effect = effect
    setImages(updatedImages)
  }

  const updateImageDuration = (index: number, duration: number) => {
    const updatedImages = [...images]
    updatedImages[index].duration = duration
    // Update start times for all subsequent images
    for (let i = index + 1; i < updatedImages.length; i++) {
      updatedImages[i].startTime = updatedImages[i - 1].startTime + updatedImages[i - 1].duration
    }
    setImages(updatedImages)
  }

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

  const renderPreview = () => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    for (const image of images) {
      if (currentTime >= image.startTime && currentTime < image.startTime + image.duration) {
        const img = new Image()
        img.onload = () => {
          ctx.save()
          
          const progress = (currentTime - image.startTime) / image.duration
          let scale = 1

          switch (image.effect) {
            case 'zoom-in':
              scale = 1 + progress * 0.5
              break
            case 'zoom-out':
              scale = 1.5 - progress * 0.5
              break
            case 'fade':
              ctx.globalAlpha = progress
              break
          }

          if (image.effect === 'zoom-in' || image.effect === 'zoom-out') {
            const centerX = canvasRef.current!.width / 2
            const centerY = canvasRef.current!.height / 2
            ctx.translate(centerX, centerY)
            ctx.scale(scale, scale)
            ctx.translate(-centerX, -centerY)
          }

          // Apply the filter
          applyFilter(ctx, image.filter)

          ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.restore()
        }
        img.src = URL.createObjectURL(image.file)
        break
      }
    }
  }

  useEffect(() => {
    renderPreview()
  }, [currentTime, images])

  const playPreview = () => {
    if (audio) {
      audio.currentTime = currentTime
      audio.play()
      const animationFrame = () => {
        setCurrentTime(audio.currentTime)
        if (audio.paused) return
        requestAnimationFrame(animationFrame)
      }
      requestAnimationFrame(animationFrame)
    }
  }

  const pausePreview = () => {
    if (audio) {
      audio.pause()
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

  const Timeline = () => {
    const timelineScale = 100 // pixels per second

    return (
      <div className="relative h-20 mt-4 overflow-x-auto">
        <div className="absolute top-0 left-0 h-full" style={{ width: `${totalDuration * timelineScale}px` }}>
          {images.map((image, index) => (
            <motion.div
              key={index}
              className={`absolute h-12 rounded ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`}
              style={{
                left: `${image.startTime * timelineScale}px`,
                width: `${image.duration * timelineScale}px`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={URL.createObjectURL(image.file)}
                alt={`Thumbnail ${index}`}
                className="h-full w-full object-cover rounded"
              />
            </motion.div>
          ))}
          <div
            className={`absolute top-0 w-0.5 h-full bg-red-500`}
            style={{ left: `${currentTime * timelineScale}px` }}
          />
        </div>
      </div>
    )
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }

    const newImages = Array.from(images)
    const [reorderedItem] = newImages.splice(result.source.index, 1)
    newImages.splice(result.destination.index, 0, reorderedItem)

    // Recalculate start times
    newImages.forEach((img, index) => {
      img.startTime = index === 0 ? 0 : newImages[index - 1].startTime + newImages[index - 1].duration
    })

    setImages(newImages)
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
    const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'output.mp4'
    a.click()
  }

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
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="images">
                    {(provided: DroppableProvided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 max-h-96 overflow-y-auto">
                        {images.map((image, index) => (
                          <Draggable key={index} draggableId={`image-${index}`} index={index}>
                            {(provided: DraggableProvided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center space-x-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                              >
                                <img src={URL.createObjectURL(image.file)} alt={`Image ${index}`} className="w-20 h-20 object-cover rounded" />
                                <div className="flex-grow space-y-2">
                                  <Select value={image.effect} onValueChange={(value) => updateImageEffect(index, value as Effect)}>
                                    <SelectTrigger className={inputClasses}>
                                      <SelectValue placeholder="Effect" />
                                    </SelectTrigger>
                                    <SelectContent className={inputClasses}>
                                      <SelectItem value="none">
                                        <span className="flex items-center">
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          None
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="zoom-in">
                                        <span className="flex items-center">
                                          <ZoomIn className="w-4 h-4 mr-2" />
                                          Zoom In
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="zoom-out">
                                        <span className="flex items-center">
                                          <ZoomOut className="w-4 h-4 mr-2" />
                                          Zoom Out
                                        </span>
                                      </SelectItem>
                                      <SelectItem value="fade">
                                        <span className="flex items-center">
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          Fade
                                        </span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={(value) => setCurrentTime(value[0])}
                      max={totalDuration}
                      step={0.1}
                      className="flex-grow"
                    />
                    <span className="text-sm font-medium w-16">{currentTime.toFixed(1)}s</span>
                  </div>
                </div>
                <Timeline />
                <Button onClick={exportVideo} className={buttonClasses}>
                  Export Video
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}