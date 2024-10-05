import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type Filter = 'none' | 'orange-and-teal' | 'golden-hour' | 'purple-undertone' | '35mm' | 'fall' | 'old-western' | 'retro' | 'bold-and-blue' | 'vibrant-vlogger' | 'winter-sunset' | 'contrast' | 'winter' | 'warm-coastline' | 'cool-countryside' | 'golden' | 'dreamscape' | 'sunrise' | 'warm-tone-film' | 'cool-tone' | 'pastel-dreams' | 'increased' | 'scenery' | 'portrait' | 'indoors' | 'outdoors' | 'san-1' | 'muted' | 'black-and-white-1'

interface ImageFiltersProps {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  inputClasses: string
}

export const applyFilter = (ctx: CanvasRenderingContext2D, filter: Filter) => {
  switch (filter) {
    case 'orange-and-teal':
      ctx.filter = 'sepia(50%) hue-rotate(20deg) saturate(150%)'
      break
    case 'golden-hour':
      ctx.filter = 'sepia(30%) brightness(110%) contrast(110%) saturate(130%)'
      break
    case 'purple-undertone':
      ctx.filter = 'hue-rotate(270deg) saturate(120%) brightness(105%)'
      break
    case '35mm':
      ctx.filter = 'contrast(110%) brightness(110%) saturate(85%) sepia(10%)'
      break
    case 'fall':
      ctx.filter = 'sepia(20%) saturate(150%) hue-rotate(350deg) contrast(110%)'
      break
    case 'old-western':
      ctx.filter = 'sepia(80%) contrast(120%) saturate(50%)'
      break
    case 'retro':
      ctx.filter = 'sepia(40%) saturate(80%) hue-rotate(330deg) brightness(90%)'
      break
    case 'bold-and-blue':
      ctx.filter = 'hue-rotate(180deg) saturate(150%) contrast(120%)'
      break
    case 'vibrant-vlogger':
      ctx.filter = 'contrast(120%) saturate(150%) brightness(110%)'
      break
    case 'winter-sunset':
      ctx.filter = 'hue-rotate(330deg) saturate(140%) contrast(110%) brightness(105%)'
      break
    case 'contrast':
      ctx.filter = 'contrast(150%) brightness(105%)'
      break
    case 'winter':
      ctx.filter = 'brightness(110%) contrast(110%) saturate(80%) hue-rotate(180deg)'
      break
    case 'warm-coastline':
      ctx.filter = 'sepia(30%) saturate(140%) hue-rotate(10deg) brightness(105%)'
      break
    case 'cool-countryside':
      ctx.filter = 'saturate(110%) brightness(105%) contrast(105%) hue-rotate(350deg)'
      break
    case 'golden':
      ctx.filter = 'sepia(40%) saturate(150%) brightness(110%) contrast(110%)'
      break
    case 'dreamscape':
      ctx.filter = 'brightness(105%) contrast(105%) saturate(120%) hue-rotate(10deg)'
      break
    case 'sunrise':
      ctx.filter = 'sepia(30%) saturate(160%) brightness(110%) contrast(105%) hue-rotate(350deg)'
      break
    case 'warm-tone-film':
      ctx.filter = 'sepia(20%) saturate(110%) contrast(110%) brightness(105%)'
      break
    case 'cool-tone':
      ctx.filter = 'saturate(90%) brightness(105%) contrast(110%) hue-rotate(180deg)'
      break
    case 'pastel-dreams':
      ctx.filter = 'saturate(120%) brightness(110%) contrast(95%) hue-rotate(10deg)'
      break
    case 'increased':
      ctx.filter = 'saturate(130%) contrast(120%) brightness(110%)'
      break
    case 'scenery':
      ctx.filter = 'saturate(120%) contrast(110%) brightness(105%) hue-rotate(355deg)'
      break
    case 'portrait':
      ctx.filter = 'saturate(110%) contrast(105%) brightness(105%) sepia(10%)'
      break
    case 'indoors':
      ctx.filter = 'brightness(105%) contrast(105%) saturate(110%) sepia(10%)'
      break
    case 'outdoors':
      ctx.filter = 'saturate(120%) contrast(110%) brightness(110%) hue-rotate(355deg)'
      break
    case 'san-1':
      ctx.filter = 'saturate(120%) contrast(110%) brightness(105%) sepia(10%)'
      break
    case 'muted':
      ctx.filter = 'saturate(80%) contrast(95%) brightness(100%)'
      break
    case 'black-and-white-1':
      ctx.filter = 'grayscale(100%) contrast(120%) brightness(110%)'
      break
    default:
      ctx.filter = 'none'
  }
}

export function ImageFilters({ filter, onFilterChange, inputClasses }: ImageFiltersProps) {
  return (
    <Select value={filter} onValueChange={(value) => onFilterChange(value as Filter)}>
      <SelectTrigger className={inputClasses}>
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent className={inputClasses}>
        <SelectItem value="none">None</SelectItem>
        <SelectItem value="orange-and-teal">Orange and Teal</SelectItem>
        <SelectItem value="golden-hour">Golden Hour</SelectItem>
        <SelectItem value="purple-undertone">Purple Undertone</SelectItem>
        <SelectItem value="35mm">35mm</SelectItem>
        <SelectItem value="fall">Fall</SelectItem>
        <SelectItem value="old-western">Old Western</SelectItem>
        <SelectItem value="retro">Retro</SelectItem>
        <SelectItem value="bold-and-blue">Bold and Blue</SelectItem>
        <SelectItem value="vibrant-vlogger">Vibrant Vlogger</SelectItem>
        <SelectItem value="winter-sunset">Winter Sunset</SelectItem>
        <SelectItem value="contrast">Contrast</SelectItem>
        <SelectItem value="winter">Winter</SelectItem>
        <SelectItem value="warm-coastline">Warm Coastline</SelectItem>
        <SelectItem value="cool-countryside">Cool Countryside</SelectItem>
        <SelectItem value="golden">Golden</SelectItem>
        <SelectItem value="dreamscape">Dreamscape</SelectItem>
        <SelectItem value="sunrise">Sunrise</SelectItem>
        <SelectItem value="warm-tone-film">Warm Tone Film</SelectItem>
        <SelectItem value="cool-tone">Cool Tone</SelectItem>
        <SelectItem value="pastel-dreams">Pastel Dreams</SelectItem>
        <SelectItem value="increased">Increased</SelectItem>
        <SelectItem value="scenery">Scenery</SelectItem>
        <SelectItem value="portrait">Portrait</SelectItem>
        <SelectItem value="indoors">Indoors</SelectItem>
        <SelectItem value="outdoors">Outdoors</SelectItem>
        <SelectItem value="san-1">三|</SelectItem>
        <SelectItem value="muted">Muted</SelectItem>
        <SelectItem value="black-and-white-1">Black & White 1</SelectItem>
      </SelectContent>
    </Select>
  )
}