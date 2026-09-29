import React from 'react';
import { BubbleAlignment } from '../types';

export interface CloudBubbleGeometry {
  svgWidth: number;
  svgHeight: number;
  bleed: number;
  pathData: string;
  tailCircles: { cx: number; cy: number; r: number }[];
}

export function buildCloudBubbleGeometry(
  width: number,
  height: number,
  borderRadius = 14,
  align: BubbleAlignment = 'left',
  hasTail = true
): CloudBubbleGeometry {
  const bleed = 14;
  const w = Math.max(40, width);
  const h = Math.max(32, height);
  const svgWidth = w + bleed * 2;
  const svgHeight = h + bleed * 2;

  const x0 = bleed;
  const y0 = bleed;
  const rCorner = Math.min(
    Math.max(10, borderRadius),
    w / 2 - 2,
    h / 2 - 2
  );

  const straightW = Math.max(0, w - 2 * rCorner);
  const straightH = Math.max(0, h - 2 * rCorner);
  const arcLen = (Math.PI / 2) * rCorner;

  // 8 segments of the rounded rectangle clockwise starting at top-left straight start (x0 + rCorner, y0)
  const segLengths = [
    straightW, // 0: top
    arcLen,    // 1: top-right corner
    straightH, // 2: right
    arcLen,    // 3: bottom-right corner
    straightW, // 4: bottom
    arcLen,    // 5: bottom-left corner
    straightH, // 6: left
    arcLen,    // 7: top-left corner
  ];

  const totalPerimeter = segLengths.reduce((acc, v) => acc + v, 0);

  const getPointAt = (dist: number): { x: number; y: number } => {
    let s = ((dist % totalPerimeter) + totalPerimeter) % totalPerimeter;

    // 0: Top edge
    if (s <= segLengths[0]) {
      return { x: x0 + rCorner + s, y: y0 };
    }
    s -= segLengths[0];

    // 1: Top-Right arc (-PI/2 to 0)
    if (s <= segLengths[1]) {
      const theta = -Math.PI / 2 + (s / arcLen) * (Math.PI / 2);
      return {
        x: x0 + w - rCorner + Math.cos(theta) * rCorner,
        y: y0 + rCorner + Math.sin(theta) * rCorner,
      };
    }
    s -= segLengths[1];

    // 2: Right edge
    if (s <= segLengths[2]) {
      return { x: x0 + w, y: y0 + rCorner + s };
    }
    s -= segLengths[2];

    // 3: Bottom-Right arc (0 to PI/2)
    if (s <= segLengths[3]) {
      const theta = (s / arcLen) * (Math.PI / 2);
      return {
        x: x0 + w - rCorner + Math.cos(theta) * rCorner,
        y: y0 + h - rCorner + Math.sin(theta) * rCorner,
      };
    }
    s -= segLengths[3];

    // 4: Bottom edge (right to left)
    if (s <= segLengths[4]) {
      return { x: x0 + w - rCorner - s, y: y0 + h };
    }
    s -= segLengths[4];

    // 5: Bottom-Left arc (PI/2 to PI)
    if (s <= segLengths[5]) {
      const theta = Math.PI / 2 + (s / arcLen) * (Math.PI / 2);
      return {
        x: x0 + rCorner + Math.cos(theta) * rCorner,
        y: y0 + h - rCorner + Math.sin(theta) * rCorner,
      };
    }
    s -= segLengths[5];

    // 6: Left edge (bottom to top)
    if (s <= segLengths[6]) {
      return { x: x0, y: y0 + h - rCorner - s };
    }
    s -= segLengths[6];

    // 7: Top-Left arc (PI to 3PI/2)
    const ratio = arcLen > 0 ? Math.min(1, s / arcLen) : 0;
    const theta = Math.PI + ratio * (Math.PI / 2);
    return {
      x: x0 + rCorner + Math.cos(theta) * rCorner,
      y: y0 + rCorner + Math.sin(theta) * rCorner,
    };
  };

  const targetStep = 26;
  const numBumps = Math.max(10, Math.round(totalPerimeter / targetStep));
  const weightsPattern = [1.08, 0.92, 1.04, 0.96];
  const rawWeights: number[] = [];
  let weightSum = 0;
  for (let i = 0; i < numBumps; i++) {
    const wVal = weightsPattern[i % weightsPattern.length];
    rawWeights.push(wVal);
    weightSum += wVal;
  }

  const points: { x: number; y: number }[] = [];
  let accum = 0;
  for (let i = 0; i < numBumps; i++) {
    points.push(getPointAt(accum));
    accum += (rawWeights[i] / weightSum) * totalPerimeter;
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < numBumps; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numBumps];
    const chord = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const rx = (chord * 0.56).toFixed(2);
    d += ` A ${rx} ${rx} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  d += ' Z';

  const tailCircles: { cx: number; cy: number; r: number }[] = [];
  if (hasTail && align === 'left') {
    tailCircles.push(
      { cx: x0 - 4, cy: y0 + 10, r: 4.8 },
      { cx: x0 - 10.5, cy: y0 + 4.5, r: 2.8 }
    );
  } else if (hasTail && align === 'right') {
    tailCircles.push(
      { cx: x0 + w + 4, cy: y0 + 10, r: 4.8 },
      { cx: x0 + w + 10.5, cy: y0 + 4.5, r: 2.8 }
    );
  }

  return {
    svgWidth,
    svgHeight,
    bleed,
    pathData: d,
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
  const geo = buildCloudBubbleGeometry(
    width,
    height,
    borderRadius,
    align,
    hasTail
  );

  const fillVal = bgColor === 'transparent' ? 'none' : bgColor;
  const strokeVal = hasBorder ? borderColor || '#E5DED3' : 'none';

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
      {/* Soft ambient shadow layer */}
      {hasShadow && (
        <g transform="translate(0, 3)" fill="rgba(0, 0, 0, 0.055)">
          <path d={geo.pathData} />
          {geo.tailCircles.map((c, idx) => (
            <circle key={`sh-${idx}`} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </g>
      )}

      {/* 4px solid bottom shadow layer */}
      {hasBottomShadow && (
        <g
          transform="translate(0, 4)"
          fill={bottomShadowColor || '#b9a98e'}
        >
          <path d={geo.pathData} />
          {geo.tailCircles.map((c, idx) => (
            <circle key={`bsh-${idx}`} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </g>
      )}

      {/* Main cloud body & tail puffs */}
      <path
        d={geo.pathData}
        fill={fillVal}
        stroke={strokeVal}
        strokeWidth={hasBorder ? 1.25 : 0}
        strokeLinejoin="round"
      />
      {geo.tailCircles.map((c, idx) => (
        <circle
          key={`tail-${idx}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={hasBorder ? 1.25 : 0}
        />
      ))}
    </svg>
  );
};
