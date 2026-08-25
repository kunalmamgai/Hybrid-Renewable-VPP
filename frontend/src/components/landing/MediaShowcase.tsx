/**
 * MediaShowcase — "The Problem We Solve" section.
 * A cinematic bento grid: field video + aerial/asset photography that makes
 * the renewable-energy problem tangible. Every frame is tinted with a dark
 * forest overlay so all media stays on-theme.
 */
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Play, Sun, Wind, Battery, Activity, Zap, Server, Waypoints } from 'lucide-react';
import { RevealSection, BackgroundGlow } from './LandingSections';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

interface Tile {
  src: string;
  alt: string;
  icon: React.ReactNode;
  label: string;
  stat?: string;
  caption: string;
}

/** Large right-column tiles */
const tallTiles: Tile[] = [
  {
    src: publicAsset('assets/solar-farm-aerial.jpg'),
    alt: 'Aerial view of a utility-scale solar farm',
    icon: <Sun size={14} className="text-amber-300" />,
    label: 'Solar PV',
    stat: '1.2 MW',
    caption: 'Peak yield tracked minute-by-minute',
  },
  {
    src: publicAsset('assets/wind-turbines-dusk.jpg'),
    alt: 'Wind turbines against a dusk sky',
    icon: <Wind size={14} className="text-teal-300" />,
    label: 'Wind',
    stat: '500 kW',
    caption: 'Night gusts fill the solar gap',
  },
];

/** Bottom strip — the wider energy system SURYA orchestrates */
const stripTiles: Tile[] = [
  {
    src: publicAsset('assets/grid-powerlines.jpg'),
    alt: 'High-voltage transmission lines at dusk',
    icon: <Waypoints size={14} className="text-sky-300" />,
    label: 'Grid Interface',
    caption: 'Import, export & net metering',
  },
  {
    src: publicAsset('assets/data-center.jpg'),
    alt: 'Data center server corridor',
    icon: <Server size={14} className="text-vpp-blue" />,
    label: 'Critical Loads',
    caption: 'Protected through every shortfall',
  },
  {
    src: publicAsset('assets/battery-storage.webp'),
    alt: 'Battery storage containers',
    icon: <Battery size={14} className="text-emerald-300" />,
    label: 'Storage',
    stat: '1 MWh',
    caption: 'Dispatched 5 min ahead',
  },
];

export function MediaShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  // Defer downloading the mp4 until it is close to being scrolled into view.
  const inView = useInView(sectionRef, { once: true, margin: '300px 0px' });

  const handlePlay = () => {
    videoRef.current?.play();
  };

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <BackgroundGlow color="orange" size="550px" top="10%" left="60%" opacity={0.08} blur="150px" />
      <BackgroundGlow color="emerald" size="500px" top="50%" left="-10%" opacity={0.06} blur="160px" />

      <div className="relative max-w-6xl mx-auto" ref={sectionRef}>
        <RevealSection className="text-center mb-16">
          <span className="tech-label tech-label-cyan !text-[10px] tracking-[0.25em]">
            The Problem We Solve
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
            The grid was built for a <span className="text-sunset-gradient">simpler world</span>
          </h2>
          <p className="text-white/50 mt-6 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Demand peaks at dusk while solar disappears at night. This is the field — generation,
            storage, grid and load — where SURYA turns volatility into autonomy, one 5-minute
            decision at a time.
          </p>
        </RevealSection>

        {/* ─── Bento grid ─── */}
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-5">
          {/* Video card */}
          <RevealSection className="lg:col-span-3">
            <div className="glass-video-frame relative overflow-hidden rounded-2xl aspect-video group h-full">
              {inView ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover brightness-[1.04] saturate-[1.12]"
                  src={publicAsset('assets/field-video.mp4')}
                  poster={publicAsset('assets/solar-sunset.webp')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={publicAsset('assets/solar-sunset.webp')}
                  alt="Field footage preview"
                  loading="lazy"
                  className="w-full h-full object-cover brightness-[1.04] saturate-[1.12]"
                />
              )}

              {/* Forest tint overlay — keeps footage on-theme */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1410]/60 via-transparent to-[#0b1410]/10 pointer-events-none" />

              {/* Live footage chip */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0b1410]/70 backdrop-blur-md border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-bold text-emerald-300/90 uppercase tracking-[0.2em]">
                  Field Footage
                </span>
              </div>

              {/* Caption bar */}
              <div className="absolute bottom-0 inset-x-0 p-5">
                <div className="flex items-center gap-2 tech-label tech-label-cyan !text-[9px] tracking-[0.2em]">
                  <Activity size={11} />
                  Golden Hour Solar
                </div>
                <p className="mt-1.5 text-sm text-white/85 font-medium leading-snug max-w-md">
                  A solar farm at sunset — the exact moments the AI forecasts minutes in advance.
                </p>
              </div>

              {/* Play badge — mobile tap-to-play (autoplay covers desktop) */}
              <button
                onClick={handlePlay}
                aria-label="Play field footage"
                className="play-badge lg:hidden absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Play size={22} className="ml-0.5" fill="currentColor" />
              </button>
            </div>
          </RevealSection>

          {/* Tall asset tiles */}
          <div className="lg:col-span-2 grid gap-4 lg:gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {tallTiles.map((tile, i) => (
              <RevealSection key={tile.label} delay={0.1 + i * 0.08}>
                <PhotoTile tile={tile} className="h-44 md:h-52 lg:h-[calc(50%-0.625rem)] min-h-[11rem]" />
              </RevealSection>
            ))}
          </div>
        </div>

        {/* ─── System strip ─── */}
        <div className="grid gap-4 lg:gap-5 sm:grid-cols-3 mt-4 lg:mt-5">
          {stripTiles.map((tile, i) => (
            <RevealSection key={tile.label} delay={i * 0.08}>
              <PhotoTile tile={tile} className="h-36 md:h-40" />
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhotoTile({ tile, className = '' }: { tile: Tile; className?: string }) {
  return (
    <div className={`glass-video-frame group relative overflow-hidden rounded-2xl ${className}`}>
      <img
        src={tile.src}
        alt={tile.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover brightness-[1.05] saturate-[1.12] transition-transform duration-700 group-hover:scale-105"
      />
      {/* Forest tint overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1410]/75 via-[#0b1410]/15 to-transparent pointer-events-none" />

      {tile.stat && (
        <span className="absolute top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-200 bg-[#0b1410]/60 backdrop-blur-sm border border-amber-400/30">
          {tile.stat}
        </span>
      )}
      <Zap size={12} className="absolute top-3.5 left-4 text-white/25" aria-hidden="true" />

      <div className="absolute bottom-0 inset-x-0 p-4">
        <div className="flex items-center gap-2">
          {tile.icon}
          <span className="text-sm font-bold text-white">{tile.label}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-white/55 font-light tracking-wide">{tile.caption}</p>
      </div>
    </div>
  );
}
