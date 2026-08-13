import { useId } from 'react';

type SuryaMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * SURYA brand mark: a rising sun above a renewable-energy leaf.
 * The flowing vein represents energy moving through the VPP network.
 */
export function SuryaMark({ size = 40, className = '', title }: SuryaMarkProps) {
  const id = useId().replace(/:/g, '');
  const backgroundId = `surya-background-${id}`;
  const leafId = `surya-leaf-${id}`;
  const sunId = `surya-sun-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={backgroundId} x1="10" y1="5" x2="39" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#173D2B" />
          <stop offset="1" stopColor="#07120E" />
        </linearGradient>
        <linearGradient id={leafId} x1="13" y1="37" x2="38" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F9F6E" />
          <stop offset="1" stopColor="#58D68D" />
        </linearGradient>
        <linearGradient id={sunId} x1="23" y1="11" x2="34" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22" fill={`url(#${backgroundId})`} />
      <circle cx="24" cy="24" r="21.25" stroke="#F6B84B" strokeOpacity="0.38" strokeWidth="1.5" />

      <path d="M29 8.5V11" stroke="#FFD56A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20.6 11.2L22.4 13" stroke="#FFD56A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M35.6 11.2L33.8 13" stroke="#FFD56A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.5 18.5H21" stroke="#FFD56A" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M37 18.5H39.5" stroke="#FFD56A" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="29" cy="18.5" r="5.5" fill={`url(#${sunId})`} />

      <path
        d="M9.5 33.7C15.4 25.9 24.4 22.2 38.5 23.4C37.1 33.2 30.4 39.4 20.8 39.4C16.2 39.4 12.4 37.4 9.5 33.7Z"
        fill={`url(#${leafId})`}
      />
      <path
        d="M11.6 37.4C17.7 31.5 24.9 27.7 34.8 25.4"
        stroke="#F4F1D0"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
      <path d="M19.2 31.5L18 35.8" stroke="#D9FBE7" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M25.2 28.6L26.7 32" stroke="#D9FBE7" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}
