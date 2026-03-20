"use client";

import { useId } from "react";

interface LakwedhaLogoProps {
  /** SVG emblem diameter in px (default 44) */
  size?: number;
  /** "h" = name beside emblem (default) | "v" = name below emblem, centred */
  layout?: "h" | "v";
  /** Colour for the "Lakwedha" wordmark */
  textColor?: string;
  /** Optional subtitle line (e.g. "Admin Portal") */
  subtitle?: string;
  /** Colour for the subtitle (defaults to 65% opacity white) */
  subtitleColor?: string;
  className?: string;
}

/**
 * Premium Lakwedha brand logo.
 *
 * Emblem: dark-green circle · gold ring · botanical herb motif (two leaves +
 * golden bud on a stem) · inner ornament ring.
 *
 * Uses React `useId()` so gradient IDs are unique even when rendered multiple
 * times on the same page.
 */
export default function LakwedhaLogo({
  size = 44,
  layout = "h",
  textColor = "white",
  subtitle,
  subtitleColor,
  className = "",
}: LakwedhaLogoProps) {
  const uid    = useId().replace(/:/g, "");
  const bgId   = `${uid}bg`;
  const goldId = `${uid}gd`;
  const leafId = `${uid}lf`;
  const budId  = `${uid}bd`;

  const emblem = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Deep-green background */}
        <radialGradient id={bgId} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#1a6636" />
          <stop offset="100%" stopColor="#041f0e" />
        </radialGradient>

        {/* Gold ring / stem gradient */}
        <linearGradient id={goldId} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fef3c7" />
          <stop offset="40%"  stopColor="#d97706" />
          <stop offset="75%"  stopColor="#b45309" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>

        {/* Leaf gradient — light green tip → rich mid-green base */}
        <linearGradient id={leafId} x1="28" y1="8" x2="28" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#a7f3d0" />
          <stop offset="55%"  stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        {/* Bud gradient — warm gold */}
        <linearGradient id={budId} x1="28" y1="7" x2="28" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fef9c3" />
          <stop offset="50%"  stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* ── Background circle ──────────────────────────────────── */}
      <circle cx="28" cy="28" r="27.5" fill={`url(#${bgId})`} />

      {/* ── Premium gold outer ring ───────────────────────────── */}
      <circle
        cx="28" cy="28" r="26.2"
        fill="none"
        stroke={`url(#${goldId})`}
        strokeWidth="1.6"
      />

      {/* ── Thin inner ornament ring ──────────────────────────── */}
      <circle
        cx="28" cy="28" r="21.5"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="0.45"
        strokeOpacity="0.4"
        strokeDasharray="2 3"
      />

      {/* ── Vertical stem ─────────────────────────────────────── */}
      <line
        x1="28" y1="43" x2="28" y2="17"
        stroke={`url(#${goldId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ── Left leaf ─────────────────────────────────────────── */}
      <path
        d="M27.8 31 C20 27 12 20 15 12.5 C17.5 7 27.8 20 27.8 29 Z"
        fill={`url(#${leafId})`}
        opacity="0.93"
      />
      {/* Left leaf centre vein */}
      <path
        d="M27 27 C21 23 16.5 17 17 13"
        stroke="#bbf7d0"
        strokeWidth="0.55"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ── Right leaf (mirror) ───────────────────────────────── */}
      <path
        d="M28.2 31 C36 27 44 20 41 12.5 C38.5 7 28.2 20 28.2 29 Z"
        fill={`url(#${leafId})`}
        opacity="0.93"
      />
      {/* Right leaf centre vein */}
      <path
        d="M29 27 C35 23 39.5 17 39 13"
        stroke="#bbf7d0"
        strokeWidth="0.55"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ── Top gold bud ──────────────────────────────────────── */}
      <path
        d="M28 18 C25 13.5 25.5 8.5 28 7 C30.5 8.5 31 13.5 28 18 Z"
        fill={`url(#${budId})`}
      />
      {/* Bud inner highlight */}
      <ellipse
        cx="27.2" cy="10.5" rx="0.9" ry="2.2"
        fill="#fef9c3"
        opacity="0.55"
        transform="rotate(-8 27.2 10.5)"
      />

      {/* ── Base ornament ─────────────────────────────────────── */}
      <path
        d="M22 43.5 L34 43.5"
        stroke={`url(#${goldId})`}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M24.5 45.5 L31.5 45.5"
        stroke="#ca8a04"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* ── Corner accent dots ────────────────────────────────── */}
      <circle cx="9"  cy="28" r="1.1" fill="#d97706" opacity="0.25" />
      <circle cx="47" cy="28" r="1.1" fill="#d97706" opacity="0.25" />
      <circle cx="28" cy="9"  r="1.1" fill="#d97706" opacity="0.15" />
    </svg>
  );

  const subtitleEl = subtitle ? (
    <p
      style={{ color: subtitleColor ?? "rgba(255,255,255,0.65)" }}
      className="text-xs tracking-wide mt-0.5"
    >
      {subtitle}
    </p>
  ) : null;

  if (layout === "v") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {emblem}
        <div className="text-center">
          <p style={{ color: textColor }} className="font-bold text-2xl tracking-wide leading-none">
            Lakwedha
          </p>
          {subtitleEl}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {emblem}
      <div>
        <p style={{ color: textColor }} className="font-bold text-xl tracking-wide leading-none">
          Lakwedha
        </p>
        {subtitleEl}
      </div>
    </div>
  );
}
