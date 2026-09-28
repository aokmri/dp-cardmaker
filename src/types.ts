export type BubbleAlignment = 'left' | 'right' | 'center';
export type TextAlignment = 'left' | 'center' | 'right';
export type CanvasAspectRatio = 'auto' | 'square' | 'story' | 'wide';

export interface Bubble {
  id: string;
  text: string;
  html?: string; // rich-text formatted HTML for partial formatting
  speaker?: string;
  speakerColor?: string;
  showSpeaker?: boolean;
  align: BubbleAlignment;
  // Position for free drag mode
  x: number; // percentage (0-100) or px
  y: number; // px from top
  width?: number; // optional fixed width or max-width
  // Formatting
  fontFamily: string;
  fontSize: number;
  color: string;
  bgColor: string;
  isBold: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  textAlign: TextAlignment;
  borderRadius: number;
  cornerStyle?: 'directional' | 'rounded' | 'sharp-tl' | 'sharp-tr'; // directional: left bubble has sharp TL, right bubble has sharp TR
  fitWidth?: boolean; // wraps text tightly with equal left-right padding
  paddingY: number;
  paddingX: number;
  hasShadow: boolean;
  hasBorder: boolean;
  borderColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  customStyleKeys?: (keyof BubbleSideStyle)[]; // tracks properties explicitly modified via individual editing (개별 편집)
}

export const SIDE_STYLE_KEYS: (keyof BubbleSideStyle)[] = [
  'fontFamily',
  'fontSize',
  'color',
  'bgColor',
  'isBold',
  'isItalic',
  'isStrikethrough',
  'isUnderline',
  'textAlign',
  'borderRadius',
  'paddingY',
  'paddingX',
  'hasShadow',
  'hasBorder',
  'borderColor',
  'letterSpacing',
  'lineHeight',
];

export interface BubbleSideStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  bgColor: string;
  isBold: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  textAlign: TextAlignment;
  borderRadius: number;
  paddingY: number;
  paddingX: number;
  hasShadow: boolean;
  hasBorder: boolean;
  borderColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface DefaultSideStyles {
  left: BubbleSideStyle;
  right: BubbleSideStyle;
  center: BubbleSideStyle;
}

export interface CanvasConfig {
  width: number;
  minHeight: number;
  bgColor: string;
  bgImageUrl?: string;
  bgImageFit?: 'cover' | 'contain' | 'repeat';
  bgImageOpacity?: number;
  paperTexture: 'none' | 'paper' | 'grain' | 'crumpled' | 'grid' | 'custom';
  textureIntensity?: number; // 5 to 100 (default 50)
  darkBgAutoBoost?: boolean; // Automatically enhance texture visibility when bgColor luminance <= darkBgThreshold
  darkBgThreshold?: number; // Luminance threshold 0-100 (default 45)
  customTextureUrl?: string;
  customTextureOpacity?: number; // 0.01 to 1.0
  customTextureBlendMode?: 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'normal';
  customTextureRepeat?: 'repeat' | 'cover';
  showDividers: boolean;
  dividerColor: string;
  dividerWidth: number; // percentage
  dividerStyle: 'solid' | 'dashed' | 'double';
  headerText: string;
  footerText: string;
  showHeader: boolean;
  showFooter: boolean;
  paddingX: number;
  paddingY: number;
  bubbleSpacing: number;
  bubbleMaxWidth: number; // percentage (e.g. 82) - text will not wrap until reaching this width
  isFreePositionMode: boolean; // if false, auto-aligned in dialogue order
}

export interface WebFont {
  id: string;
  name: string;
  family: string;
  category: 'handwriting' | 'serif' | 'sans' | 'custom';
  sourceType: 'system' | 'google' | 'noonnu' | 'file' | 'url';
  url?: string;
  cssRule?: string;
  isCustom?: boolean;
}
