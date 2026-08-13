import type { MarineActivityMarkerItem } from "~features/marine-activity/marineActivity.types";
import { MarineActivityType } from "~features/marine-activity/marineActivity.types";

export function createMarineActivityMarkerIcon(markerItem: MarineActivityMarkerItem) {
  const supportsBeach = markerItem.indices.some((index) => index.type === MarineActivityType.Beach);
  const supportsSkinScuba = markerItem.indices.some((index) => index.type === MarineActivityType.SkinScuba);
  const badgeText = supportsBeach && supportsSkinScuba
    ? "B/S"
    : supportsBeach
      ? "B"
      : "S";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
      <defs>
        <linearGradient id="marineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0ea5e9" />
          <stop offset="100%" stop-color="#155e75" />
        </linearGradient>
      </defs>
      <circle cx="36" cy="36" r="30" fill="url(#marineGradient)" />
      <circle cx="36" cy="36" r="27" fill="none" stroke="white" stroke-width="3" />
      <path d="M20 41c3.8-4.5 7.7-6.8 11.7-6.8 3.3 0 5.6 1.5 7.8 3 2 1.3 4 2.6 6.8 2.6 2.6 0 5.3-1.1 8.2-3.3v7.6c-2.8 1.7-5.7 2.5-8.5 2.5-4.7 0-7.8-1.9-10.1-3.4-1.8-1.1-3-1.9-4.7-1.9-2.6 0-5.9 1.7-10.2 5.1z" fill="white" opacity="0.95" />
      <path d="M24 28c1.8-3.4 4.8-5.1 9-5.1 2.9 0 5.2.8 6.9 2.4 1.8 1.5 3.5 2.4 5.2 2.4 1.5 0 3-.5 4.7-1.7l2 5.2c-2 1.4-4.2 2.1-6.6 2.1-3.2 0-5.9-1-8.1-3-1.7-1.4-3-2-4.4-2-2.1 0-3.8 1.1-5.4 3.3z" fill="white" opacity="0.7" />
      <circle cx="53" cy="20" r="11" fill="#082f49" />
      <text x="53" y="24" text-anchor="middle" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="white">${badgeText}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
