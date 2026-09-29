export type BubbleAlignment = 'left' | 'right' | 'center';
export type TextAlignment = 'left' | 'center' | 'right';
export type CanvasAspectRatio = 'auto' | 'square' | 'story' | 'wide';
export type CardThemeId = 'legacy' | 'default-white' | 'default-dark';
export type BubbleMetaTheme = 'outside' | 'inside';

export interface Bubble {
  id: string;
  text: string;
  html?: string; // rich-text formatted HTML for partial formatting
  showMeta?: boolean;
  speaker?: string;
  dateText?: string;
  metaTheme?: BubbleMetaTheme;
  metaFontFamily?: string;
  metaColor?: string;
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
  hasTail?: boolean; // true: one sharp corner on left/right bubble, false: all 4 corners rounded
  cornerStyle?: 'directional' | 'rounded' | 'sharp-tl' | 'sharp-tr'; // directional: left bubble has sharp TL, right bubble has sharp TR
  fitWidth?: boolean; // wraps text tightly with equal left-right padding
  paddingY: number;
  paddingX: number;
  hasShadow: boolean;
  hasBottomShadow?: boolean; // 4px solid (non-blurred) bottom shadow
  bottomShadowColor?: string;
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
  'hasTail',
  'paddingY',
  'paddingX',
  'hasShadow',
  'hasBottomShadow',
  'bottomShadowColor',
  'hasBorder',
  'borderColor',
  'letterSpacing',
  'lineHeight',
  'showMeta',
  'speaker',
  'dateText',
  'metaTheme',
  'metaFontFamily',
  'metaColor',
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
  hasTail?: boolean;
  paddingY: number;
  paddingX: number;
  hasShadow: boolean;
  hasBottomShadow?: boolean;
  bottomShadowColor?: string;
  hasBorder: boolean;
  borderColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  showMeta?: boolean;
  speaker?: string;
  dateText?: string;
  metaTheme?: BubbleMetaTheme;
  metaFontFamily?: string;
  metaColor?: string;
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
  headerFontFamily?: string;
  headerColor?: string;
  headerAlign?: TextAlignment;
  footerFontFamily?: string;
  footerColor?: string;
  footerAlign?: TextAlignment;
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
