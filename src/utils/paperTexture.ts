import { useEffect, useState } from 'react';
import { CanvasConfig } from '../types';
import { getColorLuminance } from '../data/presetFonts';

export interface ResolvedTextureLayer {
  /** Pre-composited PNG data URL (bgColor + texture with multiply/screen already baked in) */
  tileDataUrl: string | null;
  /** CSS tile size, e.g. '220px 220px' */
  backgroundSize: string;
  /** Optional vignette CSS backgroundImage (uses standard alpha blending, no mix-blend-mode needed) */
  vignetteCss?: string;
}

const textureCache = new Map<string, string>();
const inflightPromises = new Map<string, Promise<string>>();

function svgToBase64DataUrl(svgXml: string): string {
  return `data:image/svg+xml;base64,${window.btoa(svgXml)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 1A. Light-bg Hanji SVG
const HANJI_LIGHT_SVG = `<svg width="440" height="440" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="hanjiPulp"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.22" numOctaves="3" seed="4" stitchTiles="stitch" result="fibers"/><feColorMatrix in="fibers" type="matrix" values="0 0 0 0 0.28  0 0 0 0 0.21  0 0 0 0 0.14  2.4 -0.9 0 -0.42 0" result="fiberAlpha"/><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="11" stitchTiles="stitch" result="finePulp"/><feColorMatrix in="finePulp" type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0 0.12  2.1 -0.7 0 -0.45 0" result="pulpAlpha"/><feMerge><feMergeNode in="fiberAlpha"/><feMergeNode in="pulpAlpha"/></feMerge></filter><rect width="100%" height="100%" filter="url(#hanjiPulp)" opacity="0.72"/><g stroke="#594532" stroke-linecap="round" fill="none" opacity="0.55"><path d="M12 28 Q34 22 58 31" stroke-width="0.7"/><path d="M140 18 Q168 29 195 21" stroke-width="0.55"/><path d="M78 64 Q96 52 122 60" stroke-width="0.65"/><path d="M22 112 Q55 124 84 115" stroke-width="0.5"/><path d="M154 95 Q182 82 214 98" stroke-width="0.75"/><path d="M45 170 Q72 158 104 172" stroke-width="0.6"/><path d="M132 156 Q165 172 198 160" stroke-width="0.55"/><path d="M18 216 Q48 205 76 220" stroke-width="0.65"/><path d="M162 212 Q192 226 225 210" stroke-width="0.6"/><path d="M95 14 Q108 42 98 68" stroke-width="0.45"/><path d="M208 42 Q194 74 212 102" stroke-width="0.5"/><path d="M62 128 Q48 156 66 184" stroke-width="0.45"/></g><g fill="#4A3828" opacity="0.45"><circle cx="42" cy="48" r="0.9"/><circle cx="184" cy="56" r="1.1"/><circle cx="118" cy="104" r="0.8"/><circle cx="28" cy="154" r="1.0"/><circle cx="168" cy="138" r="0.85"/><circle cx="92" cy="198" r="1.1"/><circle cx="215" cy="186" r="0.75"/></g></svg>`;

// 1B. Dark-bg Hanji SVG
const HANJI_DARK_SVG = `<svg width="440" height="440" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg"><filter id="hanjiPulpDark"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.22" numOctaves="3" seed="4" stitchTiles="stitch" result="fibers"/><feColorMatrix in="fibers" type="matrix" values="0 0 0 0 0.88  0 0 0 0 0.83  0 0 0 0 0.75  2.2 -0.8 0 -0.45 0" result="fiberAlpha"/><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="11" stitchTiles="stitch" result="finePulp"/><feColorMatrix in="finePulp" type="matrix" values="0 0 0 0 0.82  0 0 0 0 0.77  0 0 0 0 0.68  1.9 -0.65 0 -0.48 0" result="pulpAlpha"/><feMerge><feMergeNode in="fiberAlpha"/><feMergeNode in="pulpAlpha"/></feMerge></filter><rect width="100%" height="100%" filter="url(#hanjiPulpDark)" opacity="0.68"/><g stroke="#EAE0D0" stroke-linecap="round" fill="none" opacity="0.65"><path d="M12 28 Q34 22 58 31" stroke-width="0.75"/><path d="M140 18 Q168 29 195 21" stroke-width="0.6"/><path d="M78 64 Q96 52 122 60" stroke-width="0.7"/><path d="M22 112 Q55 124 84 115" stroke-width="0.55"/><path d="M154 95 Q182 82 214 98" stroke-width="0.8"/><path d="M45 170 Q72 158 104 172" stroke-width="0.65"/><path d="M132 156 Q165 172 198 160" stroke-width="0.6"/><path d="M18 216 Q48 205 76 220" stroke-width="0.7"/><path d="M162 212 Q192 226 225 210" stroke-width="0.65"/><path d="M95 14 Q108 42 98 68" stroke-width="0.5"/><path d="M208 42 Q194 74 212 102" stroke-width="0.55"/><path d="M62 128 Q48 156 66 184" stroke-width="0.5"/></g><g fill="#DFD3C0" opacity="0.55"><circle cx="42" cy="48" r="0.95"/><circle cx="184" cy="56" r="1.15"/><circle cx="118" cy="104" r="0.85"/><circle cx="28" cy="154" r="1.05"/><circle cx="168" cy="138" r="0.9"/><circle cx="92" cy="198" r="1.15"/><circle cx="215" cy="186" r="0.8"/></g></svg>`;

// 2A. Light-bg Vintage Grain SVG
const VINTAGE_LIGHT_SVG = `<svg width="400" height="400" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg"><filter id="vintagePaper"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="9" stitchTiles="stitch" result="mottle"/><feColorMatrix in="mottle" type="matrix" values="0 0 0 0 0.34  0 0 0 0 0.24  0 0 0 0 0.14  2.5 -0.8 0 -0.48 0" result="mottleAlpha"/><feTurbulence type="turbulence" baseFrequency="0.82" numOctaves="4" seed="23" stitchTiles="stitch" result="coarseGrain"/><feColorMatrix in="coarseGrain" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.09  2.8 -1.0 0 -0.52 0" result="grainAlpha"/><feMerge><feMergeNode in="mottleAlpha"/><feMergeNode in="grainAlpha"/></feMerge></filter><rect width="100%" height="100%" filter="url(#vintagePaper)" opacity="0.88"/><g fill="#3E2C1C" opacity="0.55"><circle cx="34" cy="26" r="1.2"/><circle cx="156" cy="42" r="0.95"/><circle cx="88" cy="78" r="1.35"/><circle cx="192" cy="118" r="1.1"/><circle cx="46" cy="142" r="1.25"/><circle cx="124" cy="176" r="1.0"/><circle cx="178" cy="198" r="1.3"/><circle cx="22" cy="202" r="0.9"/></g></svg>`;

// 2B. Dark-bg Vintage Grain SVG
const VINTAGE_DARK_SVG = `<svg width="400" height="400" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg"><filter id="vintagePaperDark"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="9" stitchTiles="stitch" result="mottle"/><feColorMatrix in="mottle" type="matrix" values="0 0 0 0 0.84  0 0 0 0 0.76  0 0 0 0 0.64  2.3 -0.75 0 -0.48 0" result="mottleAlpha"/><feTurbulence type="turbulence" baseFrequency="0.82" numOctaves="4" seed="23" stitchTiles="stitch" result="coarseGrain"/><feColorMatrix in="coarseGrain" type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.84  0 0 0 0 0.74  2.6 -0.95 0 -0.52 0" result="grainAlpha"/><feMerge><feMergeNode in="mottleAlpha"/><feMergeNode in="grainAlpha"/></feMerge></filter><rect width="100%" height="100%" filter="url(#vintagePaperDark)" opacity="0.82"/><g fill="#E8DCCB" opacity="0.6"><circle cx="34" cy="26" r="1.2"/><circle cx="156" cy="42" r="0.95"/><circle cx="88" cy="78" r="1.35"/><circle cx="192" cy="118" r="1.1"/><circle cx="46" cy="142" r="1.25"/><circle cx="124" cy="176" r="1.0"/><circle cx="178" cy="198" r="1.3"/><circle cx="22" cy="202" r="0.9"/></g></svg>`;

// 3A. Light-bg Crumpled Macro SVG
const CRUMPLED_LIGHT_SVG = `<svg width="720" height="720" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg"><filter id="crumpleRelief" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.015 0.018" numOctaves="5" seed="19" stitchTiles="stitch" result="macroCrumple"/><feTurbulence type="fractalNoise" baseFrequency="0.048" numOctaves="4" seed="7" stitchTiles="stitch" result="microWrinkle"/><feDisplacementMap in="macroCrumple" in2="microWrinkle" scale="16" xChannelSelector="R" yChannelSelector="G" result="warpedCrumple"/><feDiffuseLighting in="warpedCrumple" lighting-color="#ffffff" surfaceScale="9.5" diffuseConstant="1.05" result="litFacets"><feDistantLight azimuth="135" elevation="38"/></feDiffuseLighting><feColorMatrix in="litFacets" type="matrix" values="0.33 0.33 0.33 0 0  0.31 0.31 0.31 0 0  0.28 0.28 0.28 0 0  0 0 0 1 0" result="warmShadow"/></filter><rect width="100%" height="100%" filter="url(#crumpleRelief)"/></svg>`;

// 3B. Light-bg Crumpled Micro SVG
const CRUMPLED_MICRO_LIGHT_SVG = `<svg width="480" height="480" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg"><filter id="crumpleMicro" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.036" numOctaves="4" seed="31" stitchTiles="stitch" result="fineFolds"/><feDiffuseLighting in="fineFolds" lighting-color="#ffffff" surfaceScale="5.5" diffuseConstant="1.1" result="fineLit"><feDistantLight azimuth="315" elevation="44"/></feDiffuseLighting><feColorMatrix in="fineLit" type="matrix" values="0.33 0.33 0.33 0 0  0.31 0.31 0.31 0 0  0.28 0.28 0.28 0 0  0 0 0 1 0"/></filter><rect width="100%" height="100%" filter="url(#crumpleMicro)"/></svg>`;

// 3C. Dark-bg Crumpled Macro SVG
const CRUMPLED_DARK_SVG = `<svg width="720" height="720" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg"><filter id="crumpleReliefDark" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.015 0.018" numOctaves="5" seed="19" stitchTiles="stitch" result="macroCrumple"/><feTurbulence type="fractalNoise" baseFrequency="0.048" numOctaves="4" seed="7" stitchTiles="stitch" result="microWrinkle"/><feDisplacementMap in="macroCrumple" in2="microWrinkle" scale="16" xChannelSelector="R" yChannelSelector="G" result="warpedCrumple"/><feDiffuseLighting in="warpedCrumple" lighting-color="#f5efe6" surfaceScale="10" diffuseConstant="0.95" result="litFacets"><feDistantLight azimuth="135" elevation="25"/></feDiffuseLighting><feColorMatrix in="litFacets" type="matrix" values="0 0 0 0 0.88  0 0 0 0 0.84  0 0 0 0 0.78  1.5 0 0 -0.58 0" result="highlightAlpha"/></filter><rect width="100%" height="100%" filter="url(#crumpleReliefDark)" opacity="0.88"/></svg>`;

// 3D. Dark-bg Crumpled Micro SVG
const CRUMPLED_MICRO_DARK_SVG = `<svg width="480" height="480" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg"><filter id="crumpleMicroDark" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.036" numOctaves="4" seed="31" stitchTiles="stitch" result="fineFolds"/><feDiffuseLighting in="fineFolds" lighting-color="#efe6d8" surfaceScale="6.5" diffuseConstant="0.95" result="fineLit"><feDistantLight azimuth="315" elevation="28"/></feDiffuseLighting><feColorMatrix in="fineLit" type="matrix" values="0 0 0 0 0.85  0 0 0 0 0.80  0 0 0 0 0.73  1.35 0 0 -0.56 0"/></filter><rect width="100%" height="100%" filter="url(#crumpleMicroDark)" opacity="0.78"/></svg>`;

function getTextureParams(bgColor: string, paperTexture: CanvasConfig['paperTexture']) {
  const bgLuminance = getColorLuminance(bgColor || '#faf9f8');
  const threshold = 45;
  const isDarkBg = bgLuminance <= threshold;
  const darkDepth = isDarkBg
    ? Math.min(1, Math.max(0.25, (threshold - bgLuminance + 10) / Math.max(15, threshold)))
    : 0;

  const intensity =
    paperTexture === 'paper'
      ? isDarkBg
        ? 0.05
        : 0.15
      : paperTexture === 'grain'
      ? 0.05
      : paperTexture === 'crumpled'
      ? 0.05
      : paperTexture === 'grid'
      ? 0.25
      : 0.15;

  return { isDarkBg, darkDepth, intensity };
}

export async function generateRasterizedTextureTile(
  bgColor: string,
  paperTexture: CanvasConfig['paperTexture']
): Promise<string | null> {
  if (!paperTexture || paperTexture === 'none' || paperTexture === 'custom') {
    return null;
  }

  const safeBg = bgColor || '#faf9f8';
  const cacheKey = `${paperTexture}:${safeBg.toLowerCase()}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const inflight = inflightPromises.get(cacheKey);
  if (inflight) return inflight;

  const promise = (async (): Promise<string> => {
    const { isDarkBg, darkDepth, intensity } = getTextureParams(safeBg, paperTexture);
    const blendOp: GlobalCompositeOperation = isDarkBg ? 'screen' : 'multiply';

    if (paperTexture === 'grid') {
      // 8x8 CSS px cell rendered at 3x scale (24x24 px per cell, 8 cells = 192x192 px -> 64x64 CSS px)
      const scale = 3;
      const cssSize = 64;
      const size = cssSize * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = safeBg;
      ctx.fillRect(0, 0, size, size);

      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.65, Math.max(0.04, intensity * (0.28 + darkDepth * 0.18)))
        : Math.min(0.35, Math.max(0.015, intensity * 0.18));
      ctx.fillStyle = isDarkBg ? '#E8DFD1' : '#2C2520';

      const step = 8 * scale;
      const radius = (isDarkBg ? 0.9 : 0.85) * scale;
      for (let y = step / 2; y < size; y += step) {
        for (let x = step / 2; x < size; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      textureCache.set(cacheKey, dataUrl);
      return dataUrl;
    }

    if (paperTexture === 'paper') {
      const scale = 2;
      const cssSize = 220;
      const size = cssSize * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = safeBg;
      ctx.fillRect(0, 0, size, size);

      const svgUrl = svgToBase64DataUrl(isDarkBg ? HANJI_DARK_SVG : HANJI_LIGHT_SVG);
      const img = await loadImage(svgUrl);

      ctx.save();
      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.95, Math.max(0.08, intensity * (0.56 + darkDepth * 0.28)))
        : Math.min(0.95, Math.max(0.04, intensity * 0.68));
      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      // Bamboo screen lines (발 무늬)
      ctx.save();
      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.55, Math.max(0.04, intensity * (0.24 + darkDepth * 0.14)))
        : Math.min(0.45, Math.max(0.02, intensity * 0.22));

      // Horizontal 1px lines every 4 CSS px
      ctx.fillStyle = isDarkBg
        ? 'rgba(232, 222, 206, 0.16)'
        : 'rgba(90, 70, 48, 0.14)';
      for (let y = 0; y < size; y += 4 * scale) {
        ctx.fillRect(0, y, size, 1 * scale);
      }

      // Vertical 1px lines every 20 CSS px (divides 220 seamlessly)
      ctx.fillStyle = isDarkBg
        ? 'rgba(232, 222, 206, 0.10)'
        : 'rgba(90, 70, 48, 0.08)';
      for (let x = 0; x < size; x += 20 * scale) {
        ctx.fillRect(x, 0, 1 * scale, size);
      }
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      textureCache.set(cacheKey, dataUrl);
      return dataUrl;
    }

    if (paperTexture === 'grain') {
      const scale = 2;
      const cssSize = 200;
      const size = cssSize * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = safeBg;
      ctx.fillRect(0, 0, size, size);

      const svgUrl = svgToBase64DataUrl(isDarkBg ? VINTAGE_DARK_SVG : VINTAGE_LIGHT_SVG);
      const img = await loadImage(svgUrl);

      ctx.save();
      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.95, Math.max(0.08, intensity * (0.62 + darkDepth * 0.26)))
        : Math.min(0.95, Math.max(0.05, intensity * 0.76));
      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      textureCache.set(cacheKey, dataUrl);
      return dataUrl;
    }

    if (paperTexture === 'crumpled') {
      const scale = 2;
      const cssSize = 360;
      const size = cssSize * scale;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = safeBg;
      ctx.fillRect(0, 0, size, size);

      const macroSvgUrl = svgToBase64DataUrl(
        isDarkBg ? CRUMPLED_DARK_SVG : CRUMPLED_LIGHT_SVG
      );
      const microSvgUrl = svgToBase64DataUrl(
        isDarkBg ? CRUMPLED_MICRO_DARK_SVG : CRUMPLED_MICRO_LIGHT_SVG
      );

      const [macroImg, microImg] = await Promise.all([
        loadImage(macroSvgUrl),
        loadImage(microSvgUrl),
      ]);

      ctx.save();
      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.95, Math.max(0.08, intensity * (0.58 + darkDepth * 0.28)))
        : Math.min(0.92, Math.max(0.06, intensity * 0.65));
      ctx.drawImage(macroImg, 0, 0, size, size);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = blendOp;
      ctx.globalAlpha = isDarkBg
        ? Math.min(0.75, Math.max(0.04, intensity * (0.34 + darkDepth * 0.18)))
        : Math.min(0.65, Math.max(0.03, intensity * 0.36));
      ctx.drawImage(microImg, 0, 0, size, size);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      textureCache.set(cacheKey, dataUrl);
      return dataUrl;
    }

    return '';
  })();

  inflightPromises.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inflightPromises.delete(cacheKey);
  }
}

export function useRasterizedPaperTexture(
  bgColor: string,
  paperTexture: CanvasConfig['paperTexture']
): ResolvedTextureLayer {
  const safeBg = bgColor || '#faf9f8';
  const cacheKey = `${paperTexture}:${safeBg.toLowerCase()}`;
  const [tileDataUrl, setTileDataUrl] = useState<string | null>(() => {
    if (!paperTexture || paperTexture === 'none' || paperTexture === 'custom') {
      return null;
    }
    return textureCache.get(cacheKey) || null;
  });

  useEffect(() => {
    if (!paperTexture || paperTexture === 'none' || paperTexture === 'custom') {
      setTileDataUrl(null);
      return;
    }

    const existing = textureCache.get(cacheKey);
    if (existing) {
      setTileDataUrl(existing);
      return;
    }

    let cancelled = false;
    generateRasterizedTextureTile(safeBg, paperTexture)
      .then((url) => {
        if (!cancelled) {
          setTileDataUrl(url);
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, safeBg, paperTexture]);

  const { isDarkBg, darkDepth, intensity } = getTextureParams(safeBg, paperTexture);

  const backgroundSize =
    paperTexture === 'paper'
      ? '220px 220px'
      : paperTexture === 'grid'
      ? '64px 64px'
      : paperTexture === 'grain'
      ? '200px 200px'
      : paperTexture === 'crumpled'
      ? '360px 360px'
      : '220px 220px';

  let vignetteCss: string | undefined;
  if (paperTexture === 'grain') {
    const vigAlpha = isDarkBg
      ? Math.min(0.75, Math.max(0.05, intensity * (0.38 + darkDepth * 0.2)))
      : Math.min(0.85, Math.max(0.04, intensity * 0.55));
    vignetteCss = isDarkBg
      ? `radial-gradient(ellipse at center, rgba(224, 206, 178, ${(0.14 * vigAlpha).toFixed(3)}) 0%, transparent 55%, rgba(214, 194, 166, ${(0.24 * vigAlpha).toFixed(3)}) 100%)`
      : `radial-gradient(ellipse at center, transparent 35%, rgba(102, 73, 42, ${(0.28 * vigAlpha).toFixed(3)}) 100%)`;
  }

  return {
    tileDataUrl,
    backgroundSize,
    vignetteCss,
  };
}
