export interface PinGeometry {
  clampedScale: number;
  pinWidth: number;
  pinHeight: number;
  cx: number;
  cy: number;
  radius: number;
  apexY: number;
  pinPath: string;
  innerRadius: number;
  containerWidth: number;
  containerHeight: number;
  badgeOffset: number;
  containerPadding: number;
}

export const buildPinGeometry = (scale = 1): PinGeometry => {
  const clampedScale = Math.max(0.7, Math.min(1.4, scale)); // clamp scale so marker never gets too small/large
  const pinWidth = 54 * clampedScale; // overall SVG width of pin
  const pinHeight = 60 * clampedScale; // overall SVG height of pin
  const cx = 28 * clampedScale; // circle center X inside SVG
  const cy = 18 * clampedScale; // circle center Y inside SVG
  const radius = 18 * clampedScale; // outer circle radius (pin head)
  const apexY = 52 * clampedScale; // Y of pin tip (triangle apex)
  const distance = apexY - cy; // vertical distance from circle center to apex
  const theta = Math.acos(radius / distance); // angle for tangent point on circle
  const xOffset = radius * Math.sin(theta); // horizontal offset to tangent point
  const yOffset = radius * Math.cos(theta); // vertical offset to tangent point
  const leftX = cx - xOffset; // left tangent X on circle
  const rightX = cx + xOffset; // right tangent X on circle
  const touchY = cy + yOffset; // Y of tangent point on circle
  const pinPath = `M ${leftX} ${touchY} A ${radius} ${radius} 0 1 1 ${rightX} ${touchY} L ${cx} ${apexY} Z`; // circle arc + triangle
  const innerRadius = radius * 0.74; // inner white circle radius
  const badgeOffset = 6 * clampedScale; // badge offset from circle edge
  const containerPadding = 24 * clampedScale; // extra container room to avoid clipping
  const containerWidth = pinWidth + containerPadding; // container width used for anchor math
  const containerHeight = pinHeight + containerPadding; // container height used for anchor math

  return {
    clampedScale,
    pinWidth,
    pinHeight,
    cx,
    cy,
    radius,
    apexY,
    pinPath,
    innerRadius,
    containerWidth,
    containerHeight,
    badgeOffset,
    containerPadding,
  };
};
