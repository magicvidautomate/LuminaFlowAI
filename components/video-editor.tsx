'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, PauseCircle, Upload, Image as ImageIcon, Music, ZoomIn, ZoomOut, Clock } from 'lucide-react'

type Effect = 'none' | 'zoom-in' | 'zoom-out' | 'fade'

type ImageItem = {
  file: File
  effect: Effect
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
        duration: 5,
        startTime: index * 5 // Initialize with sequential start times
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
              scale = 1 + progress * 0.5 // Zoom in by 50% over the duration
              break
            case 'zoom-out':
              scale = 1.5 - progress * 0.5 // Start zoomed in by 50% and zoom out
              break
            case 'fade':
              ctx.globalAlpha = progress
              break
          }

          // Apply zoom effect
          if (image.effect === 'zoom-in' || image.effect === 'zoom-out') {
            const centerX = canvasRef.current!.width / 2
            const centerY = canvasRef.current!.height / 2
            ctx.translate(centerX, centerY)
            ctx.scale(scale, scale)
            ctx.translate(-centerX, -centerY)
          }

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

  const totalDuration = images.reduce((sum, img) => Math.max(sum, img.startTime + img.duration), 0)

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">Video Editor</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audio-upload" className="flex items-center space-x-2 cursor-pointer">
                  <Music className="w-5 h-5" />
                  <span>Upload Audio</span>
                </Label>
                <Input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioUpload} className="mt-2" />
                {audioFile && <p className="text-sm text-muted-foreground mt-1">Audio uploaded: {audioFile.name}</p>}
              </div>
              <div>
                <Label htmlFor="image-upload" className="flex items-center space-x-2 cursor-pointer">
                  <ImageIcon className="w-5 h-5" />
                  <span>Upload Images</span>
                </Label>
                <Input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-muted p-4 rounded-lg">
                    <img src={URL.createObjectURL(image.file)} alt={`Image ${index}`} className="w-20 h-20 object-cover rounded" />
                    <div className="flex-grow space-y-2">
                      <Select value={image.effect} onValueChange={(value) => updateImageEffect(index, value as Effect)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Effect" />
                        </SelectTrigger>
                        <SelectContent>
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
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <Input
                          type="number"
                          value={image.startTime}
                          onChange={(e) => updateImageStartTime(index, parseFloat(e.target.value))}
                          min={0}
                          step={0.1}
                          className="w-20"
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          value={image.startTime + image.duration}
                          onChange={(e) => updateImageDuration(index, parseFloat(e.target.value) - image.startTime)}
                          min={image.startTime + 0.1}
                          step={0.1}
                          className="w-20"
                        />
                        <span>seconds</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <canvas ref={canvasRef} width={640} height={360} className="w-full h-auto border border-muted rounded-lg shadow-md" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                <Button onClick={playPreview} size="icon" variant="secondary">
                  <PlayCircle className="w-6 h-6" />
                  <span className="sr-only">Play</span>
                </Button>
                <Button onClick={pausePreview} size="icon" variant="secondary">
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
        </CardContent>
      </Card>
    </div>
  )
}