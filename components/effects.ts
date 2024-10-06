import { Effect } from './video-editor'

export type EffectParams = Record<string, number | string>

export const applyEffect = (
  ctx: CanvasRenderingContext2D,
  effect: Effect,
  params: EffectParams,
  progress: number
) => {
  switch (effect) {
    case 'flash':
      applyFlashEffect(ctx, params.intensity as number, params.duration as number, progress)
      break
    case 'pulse':
      applyPulseEffect(ctx, params.frequency as number, params.amplitude as number, progress)
      break
    case 'spin':
      applySpinEffect(ctx, params.speed as number, params.direction as string, progress)
      break
    case 'vhs':
      applyVHSEffect(ctx, params.noiseIntensity as number, params.scanLineOpacity as number)
      break
    case 'rotate':
      applyRotateEffect(ctx, params.angle as number)
      break
    case 'vaporwave':
      applyVaporwaveEffect(ctx, params.colorIntensity as number, params.glitchFrequency as number)
      break
    case 'chromatic-aberration':
      applyChromaticAberrationEffect(ctx, params.intensity as number)
      break
    case 'crash-zoom':
      applyCrashZoomEffect(ctx, params.direction as string, params.duration as number, params.scale as number, progress)
      break
    case 'slow-zoom':
      applySlowZoomEffect(ctx, params.startScale as number, params.endScale as number, progress)
      break
    case 'green-screen':
      applyGreenScreenEffect(ctx, params.tolerance as number, params.feather as number)
      break
    case 'random':
      applyRandomEffect(ctx, progress)
      break
  }
}

const applyFlashEffect = (ctx: CanvasRenderingContext2D, intensity: number, duration: number, progress: number) => {
  const flashIntensity = Math.sin(progress * Math.PI) * intensity
  ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`
  ctx.fillRect(-ctx.canvas.width / 2, -ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height)
}

const applyPulseEffect = (ctx: CanvasRenderingContext2D, frequency: number, amplitude: number, progress: number) => {
  const scale = 1 + Math.sin(progress * Math.PI * 2 * frequency) * amplitude
  ctx.scale(scale, scale)
}

const applySpinEffect = (ctx: CanvasRenderingContext2D, speed: number, direction: string, progress: number) => {
  const angle = progress * 360 * speed * (direction === 'clockwise' ? 1 : -1)
  ctx.rotate(angle * Math.PI / 180)
}

const applyVHSEffect = (ctx: CanvasRenderingContext2D, noiseIntensity: number, scanLineOpacity: number) => {
  ctx.filter = `saturate(120%) contrast(110%) brightness(110%)`
  // Add scan lines
  for (let y = 0; y < ctx.canvas.height; y += 2) {
    ctx.fillStyle = `rgba(0, 0, 0, ${scanLineOpacity})`
    ctx.fillRect(-ctx.canvas.width / 2, y - ctx.canvas.height / 2, ctx.canvas.width, 1)
  }
  // Add noise
  const imageData = ctx.getImageData(-ctx.canvas.width / 2, -ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height)
  const pixels = imageData.data
  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * noiseIntensity * 255
    pixels[i] += noise
    pixels[i + 1] += noise
    pixels[i + 2] += noise
  }
  ctx.putImageData(imageData, -ctx.canvas.width / 2, -ctx.canvas.height / 2)
}

const applyRotateEffect = (ctx: CanvasRenderingContext2D, angle: number) => {
  ctx.rotate(angle * Math.PI / 180)
}

const applyVaporwaveEffect = (ctx: CanvasRenderingContext2D, colorIntensity: number, glitchFrequency: number) => {
  // This is a simplified Vaporwave effect. For a more realistic effect, you'd need to implement a custom shader.
  ctx.filter = `saturate(${150 * colorIntensity}%) hue-rotate(270deg) contrast(110%)`
  // Add glitch effect using additional canvas operations
}

const applyChromaticAberrationEffect = (ctx: CanvasRenderingContext2D, intensity: number) => {
  // This is a simplified Chromatic Aberration effect. For a more realistic effect, you'd need to implement a custom shader.
  ctx.filter = `url(#chromatic-aberration)`
  // You would need to define a custom SVG filter for chromatic aberration
}

const applyCrashZoomEffect = (ctx: CanvasRenderingContext2D, direction: string, duration: number, scale: number, progress: number) => {
  const currentScale = direction === 'in' ? 1 + (scale - 1) * progress : scale - (scale - 1) * progress
  ctx.scale(currentScale, currentScale)
}

const applySlowZoomEffect = (ctx: CanvasRenderingContext2D, startScale: number, endScale: number, progress: number) => {
  const currentScale = startScale + (endScale - startScale) * progress
  ctx.scale(currentScale, currentScale)
}

const applyGreenScreenEffect = (ctx: CanvasRenderingContext2D, tolerance: number, feather: number) => {
  // This is a placeholder for the green screen effect.
  // Implementing a proper green screen effect requires pixel-level manipulation,
  // which is best done using WebGL or a custom shader.
}

const applyRandomEffect = (ctx: CanvasRenderingContext2D, progress: number) => {
  // Randomly choose and apply one of the other effects
  const effects = ['flash', 'pulse', 'spin', 'vhs', 'rotate', 'vaporwave', 'chromatic-aberration', 'crash-zoom', 'slow-zoom']
  const randomEffect = effects[Math.floor(Math.random() * effects.length)] as Effect
  applyEffect(ctx, randomEffect, getDefaultEffectParams(randomEffect), progress)
}

const getDefaultEffectParams = (effect: Effect): EffectParams => {
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