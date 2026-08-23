import { useState, useEffect } from "react";

export function DiagonalSplashIntro() {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<"meteor" | "impact" | "crack" | "split" | "done">("meteor");

  useEffect(() => {
    setMounted(true);
    // 1. Meteor falling from space (0 - 750ms)
    const t1 = setTimeout(() => {
      setStage("impact");
    }, 750);

    // 2. Impact shockwave & diagonal crack line creation (750ms - 1200ms)
    const t2 = setTimeout(() => {
      setStage("crack");
    }, 1200);

    // 3. Diagonal split opening (1200ms - 1700ms -> split active)
    const t3 = setTimeout(() => {
      setStage("split");
    }, 1700);

    // 4. Complete unmount (2500ms)
    const t4 = setTimeout(() => {
      setStage("done");
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!mounted || stage === "done") {
    return <div className="hidden" aria-hidden="true" />;
  }

  // Exact matching diagonal coordinates: from (0%, 58%) to (100%, 42%)
  const topClip = "polygon(0 0, 100% 0, 100% 42%, 0 58%)";
  const bottomClip = "polygon(0 58%, 100% 42%, 100% 100%, 0 100%)";

  return (
    <div
      className={`fixed inset-0 z-[99999] pointer-events-auto overflow-hidden bg-black select-none ${stage === "impact" ? "animate-impact-shake" : ""
        }`}
    >
      {/* Meteor Shockwave Rings */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 transition-opacity duration-300 ${stage === "impact" || stage === "crack" ? "opacity-100" : "opacity-0"
          }`}
      >
        <div className="w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full border-4 border-neon-cyan/80 animate-shockwave shadow-[0_0_80px_#00f3ff]" />
        <div className="w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full border-4 border-neon-purple/80 animate-shockwave delay-100 shadow-[0_0_80px_#a855f7]" />
      </div>

      {/* Top-Right Half (Background + Top Half Logo) */}
      <div
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${stage === "split"
            ? "translate-x-[90vw] -translate-y-[90vh] rotate-3 opacity-0"
            : stage === "crack"
              ? "-translate-x-2 -translate-y-2"
              : "translate-x-0 translate-y-0"
          }`}
        style={{
          clipPath: topClip,
        }}
      >
        <div className="relative h-full w-full bg-[#07090e] grid-runes flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-radial from-neon-purple/30 via-transparent to-transparent pointer-events-none" />

          {/* Large Centered Logo */}
          <div className={`relative flex flex-col items-center justify-center ${stage === "meteor" ? "animate-meteor" : ""}`}>
            <div className="relative">
              <img
                src="/logo.png"
                alt="CyberTech Logo"
                className="h-56 sm:h-72 md:h-80 lg:h-96 w-auto object-contain drop-shadow-[0_0_50px_rgba(0,243,255,0.85)]"
              />
            </div>
            <div className="text-center mt-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[0.25em] text-neon glow-text">
                CyberTech
              </h1>
              <p className="font-display text-sm sm:text-base uppercase tracking-[0.45em] text-neon-cyan font-bold mt-2">
                Hunter Academy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-Left Half (Background + Bottom Half Logo) */}
      <div
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${stage === "split"
            ? "-translate-x-[90vw] translate-y-[90vh] -rotate-3 opacity-0"
            : stage === "crack"
              ? "translate-x-2 translate-y-2"
              : "translate-x-0 translate-y-0"
          }`}
        style={{
          clipPath: bottomClip,
        }}
      >
        <div className="relative h-full w-full bg-[#07090e] grid-runes flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-radial from-neon-cyan/30 via-transparent to-transparent pointer-events-none" />

          {/* Large Centered Logo */}
          <div className={`relative flex flex-col items-center justify-center ${stage === "meteor" ? "animate-meteor" : ""}`}>
            <div className="relative">
              <img
                src="/logo.png"
                alt="CyberTech Logo"
                className="h-56 sm:h-72 md:h-80 lg:h-96 w-auto object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.85)]"
              />
            </div>
            <div className="text-center mt-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[0.25em] text-neon glow-text">
                CyberTech
              </h1>
              <p className="font-display text-sm sm:text-base uppercase tracking-[0.45em] text-neon-cyan font-bold mt-2">
                Hunter Academy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Mathematically Matched SVG Light Ray Beam */}
      <svg
        className={`absolute inset-0 h-full w-full pointer-events-none z-30 overflow-visible transition-opacity duration-300 ${stage === "impact" || stage === "crack" || stage === "split" ? "opacity-100" : "opacity-0"
          }`}
      >
        <defs>
          <linearGradient id="crackBeam" x1="0%" y1="58%" x2="100%" y2="42%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
            <stop offset="15%" stopColor="#00f3ff" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <filter id="neonGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="18" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Neon Glow Light Ray */}
        <line
          x1="0%"
          y1="58%"
          x2="100%"
          y2="42%"
          stroke="url(#crackBeam)"
          strokeWidth="14"
          filter="url(#neonGlowBlur)"
          className={`transition-opacity duration-300 ${stage === "crack" || stage === "split" ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Core White Laser Streak */}
        <line
          x1="0%"
          y1="58%"
          x2="100%"
          y2="42%"
          stroke="#ffffff"
          strokeWidth="4"
          className={`transition-opacity duration-300 ${stage === "crack" || stage === "split" ? "opacity-100" : "opacity-0"
            }`}
        />
      </svg>

      {/* Impact Sparks & Flash */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${stage === "impact" ? "opacity-100" : "opacity-0"
          }`}
      >
        <div className="w-full h-full bg-white/25 blur-2xl animate-ping" />
      </div>

      {/* System Status Text */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 font-display text-sm tracking-[0.35em] uppercase text-neon-cyan transition-opacity duration-300 z-40 ${stage === "split" ? "opacity-0" : "opacity-100"
          }`}
      >
        <span className="inline-block animate-pulse font-bold">
          {stage === "meteor"
            ? "METEORIC GATE DESCENDING..."
            : stage === "impact" || stage === "crack"
              ? "FRACTURING SYSTEM BARRIER..."
              : "ARISE, HUNTER..."}
        </span>
      </div>
    </div>
  );
}

