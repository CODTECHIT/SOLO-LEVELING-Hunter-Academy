import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface HunterStatsBarProps {
  expCurrent?: number;
  expMax?: number;
  hpPercent?: number;
  mpPercent?: number;
  streak?: number;
  className?: string;
}

export function HunterStatsBar({
  expCurrent = 74999,
  expMax = 75000,
  hpPercent = 92,
  mpPercent = 68,
  streak = 0,
  className,
}: HunterStatsBarProps) {
  const [animated, setAnimated] = useState(false);
  const [displayExp, setDisplayExp] = useState(0);
  const [displayHp, setDisplayHp] = useState(0);
  const [displayMp, setDisplayMp] = useState(0);

  useEffect(() => {
    // 1. Expand progress bar widths smoothly on load
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);

    // 2. Count-up animation for numbers
    let startTimestamp: number | null = null;
    const duration = 1400; // 1.4s count up

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);

      setDisplayExp(Math.floor(ease * expCurrent));
      setDisplayHp(Math.floor(ease * hpPercent));
      setDisplayMp(Math.floor(ease * mpPercent));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);

    return () => clearTimeout(timer);
  }, [expCurrent, hpPercent, mpPercent]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 w-full lg:w-[420px] max-w-full min-w-0 rounded-2xl border border-neon-purple/40 bg-surface-2/60 p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.18)] relative overflow-hidden group",
        className,
      )}
    >
      {/* Background Neon Pulse Glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-neon-cyan/15 blur-2xl pointer-events-none group-hover:bg-neon-cyan/25 transition-all duration-500" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-neon-purple/15 blur-2xl pointer-events-none group-hover:bg-neon-purple/25 transition-all duration-500" />

      {/* 1. EXP Section */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-display uppercase tracking-wider sm:tracking-widest text-muted-foreground font-bold">
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="h-2 w-2 rounded-full bg-neon-cyan animate-ping" />
            EXP
          </span>
          <span className="text-neon-cyan font-bold glow-text tracking-wider">
            {displayExp.toLocaleString()} / {expMax.toLocaleString()}
          </span>
        </div>
        <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden relative border border-neon-cyan/30 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-neon-cyan/70 via-neon-cyan to-white rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_#00f3ff]"
            style={{ width: animated ? `${Math.min((expCurrent / expMax) * 100, 100)}%` : "0%" }}
          >
            {/* Shimmer energy line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* 2. HP & MP Section */}
      <div className="flex gap-2.5 sm:gap-4 min-w-0">
        {/* HP • FOCUS Bar */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-display uppercase tracking-wider sm:tracking-widest text-muted-foreground font-bold">
            <span className="flex items-center gap-1 sm:gap-1.5 text-foreground truncate">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-lime" />
              HP • FOCUS
            </span>
            <span className="text-neon-lime font-bold glow-text shrink-0 ml-1">{displayHp}%</span>
          </div>
          <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden relative border border-neon-lime/30 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-neon-lime/70 via-neon-lime to-white rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_12px_#22c55e]"
              style={{ width: animated ? `${hpPercent}%` : "0%" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* MP • STREAK Bar */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-display uppercase tracking-wider sm:tracking-widest text-muted-foreground font-bold">
            <span className="flex items-center gap-1 sm:gap-1.5 text-foreground truncate">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-purple" />
              MP • STREAK {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-neon-amber">
                  (<Flame className="h-3 w-3" />{streak}d)
                </span>
              )}
            </span>
            <span className="text-neon-purple font-bold glow-text shrink-0 ml-1">{displayMp}%</span>
          </div>
          <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden relative border border-neon-purple/30 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-neon-purple/70 via-neon-purple to-white rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_12px_#a855f7]"
              style={{ width: animated ? `${mpPercent}%` : "0%" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
