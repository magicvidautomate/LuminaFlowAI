'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, PauseCircle, Upload, Image as ImageIcon, Music, ZoomIn, ZoomOut, Clock, Sun, Moon } from 'lucide-react'

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
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {images.map((image, index) => (
                    <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
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
                  ))}
                </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}