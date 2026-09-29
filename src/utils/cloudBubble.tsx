import React, { useId } from 'react';
import { BubbleAlignment } from '../types';

export interface CloudPuffCircle {
  cx: number;
  cy: number;
  r: number;
}

export interface CloudBubbleGeometry {
  svgWidth: number;
  svgHeight: number;
  bleed: number;
  baseRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
  };
  bodyCircles: CloudPuffCircle[];
  tailCircles: CloudPuffCircle[];
}

/**
 * Builds the cloud thought-bubble geometry modeled directly after the classic `.thought` CSS:
 * - `.thought`: pill/rounded-rectangle base (`border-radius: 30px`)
 * - `.thought:before`: 44x44 circle at `top: -12px; left: 28px;`
 *   with `box-shadow: -50px 30px 0 -12px` (20x20 circle protruding 10px on the lower-left)
 * - `.thought:after`: 30x30 circle at `bottom: -10px; right: 26px;`
 *   with `box-shadow: 40px -34px 0 0` (30x30 circle protruding 14px on the upper-right)
 *   and `-28px -6px 0 -2px` (26x26 circle protruding 2px on the bottom-mid)
 * Keeps the speech bubble tail circles at the existing top-left / top-right position.
 */
export function buildCloudBubbleGeometry(
  width: number,
  height: number,
  borderRadius = 14,
  align: BubbleAlignment = 'left',
  hasTail = true
): CloudBubbleGeometry {
  const bleed = 20;
  const w = Math.max(44, width);
  const h = Math.max(34, height);
  const svgWidth = w + bleed * 2;
  const svgHeight = h + bleed * 2;

  const x0 = bleed;
  const y0 = bleed;

  // Scale down gently only when bubble is smaller than the CSS reference (~96x48)
  const sizeScale = Math.min(1, Math.max(0.72, Math.min(w / 96, h / 46)));
  // Subtle responsiveness to the corner radius slider while keeping 14px = 1.0x reference CSS
  const radiusFactor = 0.85 + 0.15 * Math.min(1.6, Math.max(0.5, (borderRadius ?? 14) / 14));
  const s = sizeScale * radiusFactor;

  // .thought { border-radius: 30px }
  const baseRx = Math.min(30 * radiusFactor, w / 2, h / 2);

  const bodyCircles: CloudPuffCircle[] = [];

  // 1. .thought:before -> width: 44px; height: 44px; top: -12px; left: 28px;
  const beforeR = 22 * s;
  const beforeTopProtrude = 12 * s;
  const beforeLeft =
    w >= 96 ? 28 : Math.max(6, (w - beforeR * 2) * 0.42);
  const beforeCx = x0 + beforeLeft + beforeR;
  const beforeCy = y0 - beforeTopProtrude + beforeR; // y0 + 10 * s
  bodyCircles.push({
    cx: beforeCx,
    cy: beforeCy,
    r: beforeR,
  });

  // 2. .thought:before box-shadow: -50px 30px 0 -12px (20x20 circle, r=10, protrudes 10px left)
  const leftPuffR = 10 * s;
  const leftPuffCx = x0; // centered on left edge so it protrudes 10*s to the left
  const leftPuffCy = Math.min(
    y0 + h - leftPuffR * 0.85,
    Math.max(y0 + leftPuffR + 6, y0 + 10 * s + 30 * sizeScale)
  );
  bodyCircles.push({
    cx: leftPuffCx,
    cy: leftPuffCy,
    r: leftPuffR,
  });

  // 3. .thought:after -> width: 30px; height: 30px; bottom: -10px; right: 26px;
  const afterR = 15 * s;
  const afterBottomProtrude = 10 * s;
  const afterRight =
    w >= 96 ? 26 : Math.max(6, (w - afterR * 2) * 0.38);
  const afterCx = x0 + w - afterRight - afterR;
  const afterCy = y0 + h + afterBottomProtrude - afterR; // y0 + h - 5 * s
  bodyCircles.push({
    cx: afterCx,
    cy: afterCy,
    r: afterR,
  });

  // 4. .thought:after box-shadow 1: 40px -34px 0 0 (30x30 circle, r=15, protrudes 14px right)
  const rightPuffR = 15 * s;
  const rightPuffCx = x0 + w - 1 * s; // protrudes 14*s to the right of (x0 + w)
  const rightPuffCy = Math.max(
    y0 + rightPuffR * 0.9,
    Math.min(y0 + h - rightPuffR, afterCy - 34 * sizeScale)
  );
  bodyCircles.push({
    cx: rightPuffCx,
    cy: rightPuffCy,
    r: rightPuffR,
  });

  // 5. .thought:after box-shadow 2: -28px -6px 0 -2px (26x26 circle, r=13, protrudes 2px bottom)
  const bottomMidR = 13 * s;
  const bottomMidCx = Math.max(
    x0 + bottomMidR + 8,
    afterCx - 28 * sizeScale
  );
  const bottomMidCy = y0 + h + 2 * s - bottomMidR; // y0 + h - 11 * s
  bodyCircles.push({
    cx: bottomMidCx,
    cy: bottomMidCy,
    r: bottomMidR,
  });

  // 6. If the bubble is wider than the single .thought box (> 130px), continue the .thought
  // asymmetric puff rhythm across the remaining top and bottom spans so wide bubbles stay cloud-like.
  const topRightSpanStart = beforeCx + beforeR * 0.72;
  const topRightSpanEnd = x0 + w - 18;
  if (topRightSpanEnd - topRightSpanStart > 14) {
    const extraTopSpan = topRightSpanEnd - topRightSpanStart;
    const extraTopCount = Math.max(1, Math.round(extraTopSpan / 36));
    const step = extraTopSpan / extraTopCount;
    for (let i = 0; i < extraTopCount; i++) {
      const isLarge = i % 2 === 1;
      const r = (isLarge ? 19 : 15.5) * s;
      const protrude = (isLarge ? 10.5 : 8.5) * s;
      bodyCircles.push({
        cx: topRightSpanStart + step * (i + 0.5),
        cy: y0 - protrude + r,
        r,
      });
    }
  }

  const bottomLeftSpanStart = x0 + 22;
  const bottomLeftSpanEnd = bottomMidCx - bottomMidR * 0.65;
  if (bottomLeftSpanEnd - bottomLeftSpanStart > 14) {
    const extraBotSpan = bottomLeftSpanEnd - bottomLeftSpanStart;
    const extraBotCount = Math.max(1, Math.round(extraBotSpan / 34));
    const step = extraBotSpan / extraBotCount;
    for (let i = 0; i < extraBotCount; i++) {
      const isLarge = i % 2 === 0;
      const r = (isLarge ? 15 : 13) * s;
      const protrude = (isLarge ? 8.5 : 3.5) * s;
      bodyCircles.push({
        cx: bottomLeftSpanStart + step * (i + 0.5),
        cy: y0 + h + protrude - r,
        r,
      });
    }
  }

  // If the bubble is tall (multi-line), add side puffs to maintain the .thought silhouette vertically
  if (h > 84) {
    const extraSideCount = Math.max(1, Math.floor((h - 50) / 40));
    for (let i = 1; i <= extraSideCount; i++) {
      const frac = (i + 0.5) / (extraSideCount + 1);
      bodyCircles.push({
        cx: x0 + 1 * s,
        cy: y0 + h * frac,
        r: 11 * s,
      });
      bodyCircles.push({
        cx: x0 + w - 1 * s,
        cy: y0 + h * (1 - frac * 0.7),
        r: 14 * s,
      });
    }
  }

  // Merge speech bubble tail naturally into the top-left / top-right corner (~5px inward).
  // - When hasTail is ON: keep the inner attached circle (r=5.2) and place the outer small circle 2px further outward.
  // - When hasTail is OFF: keep the inner attached circle with a slightly larger radius (r=7.2) pushed 3px further inward.
  const tailCircles: CloudPuffCircle[] = [];
  if (align === 'right') {
    if (hasTail) {
      tailCircles.push(
        { cx: x0 + w - 1, cy: y0 + 11.5, r: 5.2 },
        { cx: x0 + w + 7.5, cy: y0 + 4.0, r: 3.0 }
      );
    } else {
      tailCircles.push({ cx: x0 + w - 4, cy: y0 + 12.5, r: 7.2 });
    }
  } else {
    if (hasTail) {
      tailCircles.push(
        { cx: x0 + 1, cy: y0 + 11.5, r: 5.2 },
        { cx: x0 - 7.5, cy: y0 + 4.0, r: 3.0 }
      );
    } else {
      tailCircles.push({ cx: x0 + 4, cy: y0 + 12.5, r: 7.2 });
    }
  }

  return {
    svgWidth,
    svgHeight,
    bleed,
    baseRect: {
      x: x0,
      y: y0,
      width: w,
      height: h,
      rx: baseRx,
    },
    bodyCircles,
    tailCircles,
  };
}

interface CloudBubbleBackgroundProps {
  width: number;
  height: number;
  bgColor: string;
  borderRadius: number;
  align: BubbleAlignment;
  hasTail: boolean;
  hasBorder: boolean;
  borderColor?: string;
  hasShadow: boolean;
  hasBottomShadow?: boolean;
  bottomShadowColor?: string;
}

export const CloudBubbleBackground: React.FC<CloudBubbleBackgroundProps> = ({
  width,
  height,
  bgColor,
  borderRadius,
  align,
  hasTail,
  hasBorder,
  borderColor = '#E5DED3',
  hasShadow,
  hasBottomShadow = false,
  bottomShadowColor = '#b9a98e',
}) => {
  const rawId = useId();
  const maskId = `cloud-border-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const geo = buildCloudBubbleGeometry(
    width,
    height,
    borderRadius,
    align,
    hasTail
  );

  const isTransparent = bgColor === 'transparent';
  const fillVal = isTransparent ? 'none' : bgColor;
  const strokeVal = hasBorder ? borderColor || '#E5DED3' : 'none';

  const renderBodyPrimitives = (keyPrefix: string) => (
    <>
      <rect
        x={geo.baseRect.x}
        y={geo.baseRect.y}
        width={geo.baseRect.width}
        height={geo.baseRect.height}
        rx={geo.baseRect.rx}
        ry={geo.baseRect.rx}
      />
      {geo.bodyCircles.map((c, idx) => (
        <circle key={`${keyPrefix}-${idx}`} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {geo.tailCircles.map((c, idx) => (
        <circle key={`${keyPrefix}-tail-${idx}`} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
    </>
  );

  return (
    <svg
      width={geo.svgWidth}
      height={geo.svgHeight}
      viewBox={`0 0 ${geo.svgWidth} ${geo.svgHeight}`}
      style={{
        position: 'absolute',
        top: `-${geo.bleed}px`,
        left: `-${geo.bleed}px`,
        width: `${geo.svgWidth}px`,
        height: `${geo.svgHeight}px`,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 0,
      }}
      aria-hidden="true"
    >
      {isTransparent && hasBorder && (
        <defs>
          <mask id={maskId}>
            <rect
              x="0"
              y="0"
              width={geo.svgWidth}
              height={geo.svgHeight}
              fill="white"
            />
            <g fill="black">{renderBodyPrimitives('mask')}</g>
          </mask>
        </defs>
      )}

      {/* Soft ambient shadow layer (group-level opacity avoids overlap darkening) */}
      {hasShadow && (
        <g transform="translate(0, 3)" fill="#000000" opacity={0.055}>
          {renderBodyPrimitives('sh')}
        </g>
      )}

      {/* 4px solid bottom shadow layer */}
      {hasBottomShadow && (
        <g
          transform="translate(0, 4)"
          fill={bottomShadowColor || '#b9a98e'}
        >
          {renderBodyPrimitives('bsh')}
        </g>
      )}

      {/* Outer contour border of the unified .thought cloud body + tail (no internal circle overlap lines) */}
      {hasBorder && (
        <g
          fill={strokeVal}
          stroke={strokeVal}
          strokeWidth={2.5}
          strokeLinejoin="round"
          mask={isTransparent ? `url(#${maskId})` : undefined}
        >
          {renderBodyPrimitives('border')}
        </g>
      )}

      {/* Unified .thought cloud body + tail fill */}
      {!isTransparent && (
        <g fill={fillVal}>{renderBodyPrimitives('fill')}</g>
      )}
    </svg>
  );
};

