import { useState, useEffect } from "react";

export function DiagonalSplashIntro() {
  const [stage, setStage] = useState<"meteor" | "impact" | "crack" | "split" | "done">("meteor");

  useEffect(() => {
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

  if (stage === "done") {
    return null;
  }

  // Exact matching diagonal coordinates: from (0%, 58%) to (100%, 42%)
  const topClip = "polygon(0 0, 100% 0, 100% 42%, 0 58%)";
  const bottomClip = "polygon(0 58%, 100% 42%, 100% 100%, 0 100%)";

  return (
    <div
      className={`fixed inset-0 z-[99999] pointer-events-auto overflow-hidden bg-black select-none ${
        stage === "impact" ? "animate-impact-shake" : ""
      }`}
    >
      {/* Meteor Shockwave Rings */}
      {(stage === "impact" || stage === "crack") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-64 h-64 rounded-full border-4 border-neon-cyan/80 animate-shockwave shadow-[0_0_50px_#00f3ff]" />
          <div className="w-64 h-64 rounded-full border-4 border-neon-purple/80 animate-shockwave delay-100 shadow-[0_0_50px_#a855f7]" />
        </div>
      )}

      {/* Top-Right Half (Background + Top Half Logo) */}
      <div
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
          stage === "split"
            ? "translate-x-[90vw] -translate-y-[90vh] rotate-3 opacity-0"
            : stage === "crack"
            ? "-translate-x-1.5 -translate-y-1.5"
            : "translate-x-0 translate-y-0"
        }`}
        style={{
          clipPath: topClip,
        }}
      >
        <div className="relative h-full w-full bg-[#07090e] grid-runes flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-radial from-neon-purple/25 via-transparent to-transparent pointer-events-none" />

          {/* Logo Container with Meteor Fall Animation */}
          <div className={`relative flex flex-col items-center ${stage === "meteor" ? "animate-meteor" : ""}`}>
            <div className="relative">
              <img
                src="/logo.png"
                alt="Solo Leveling Logo"
                className="h-36 sm:h-44 w-auto object-contain drop-shadow-[0_0_35px_rgba(0,243,255,0.7)]"
              />
            </div>
            <div className="text-center mt-3">
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-[0.25em] text-neon glow-text">
                Solo Leveling
              </h1>
              <p className="font-display text-xs uppercase tracking-[0.4em] text-neon-cyan mt-1">
                Hunter Academy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-Left Half (Background + Bottom Half Logo) */}
      <div
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
          stage === "split"
            ? "-translate-x-[90vw] translate-y-[90vh] -rotate-3 opacity-0"
            : stage === "crack"
            ? "translate-x-1.5 translate-y-1.5"
            : "translate-x-0 translate-y-0"
        }`}
        style={{
          clipPath: bottomClip,
        }}
      >
        <div className="relative h-full w-full bg-[#07090e] grid-runes flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-radial from-neon-cyan/25 via-transparent to-transparent pointer-events-none" />

          {/* Logo Container with Meteor Fall Animation */}
          <div className={`relative flex flex-col items-center ${stage === "meteor" ? "animate-meteor" : ""}`}>
            <div className="relative">
              <img
                src="/logo.png"
                alt="Solo Leveling Logo"
                className="h-36 sm:h-44 w-auto object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.7)]"
              />
            </div>
            <div className="text-center mt-3">
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-[0.25em] text-neon glow-text">
                Solo Leveling
              </h1>
              <p className="font-display text-xs uppercase tracking-[0.4em] text-neon-cyan mt-1">
                Hunter Academy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Mathematically Matched SVG Light Ray Beam */}
      {(stage === "impact" || stage === "crack" || stage === "split") && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none z-30 overflow-visible">
          <defs>
            <linearGradient id="crackBeam" x1="0%" y1="58%" x2="100%" y2="42%">
              <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
              <stop offset="15%" stopColor="#00f3ff" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="85%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
            <filter id="neonGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="15" result="blur2" />
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
            strokeWidth="12"
            filter="url(#neonGlowBlur)"
            className={`transition-opacity duration-300 ${
              stage === "crack" || stage === "split" ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Core White Laser Streak */}
          <line
            x1="0%"
            y1="58%"
            x2="100%"
            y2="42%"
            stroke="#ffffff"
            strokeWidth="3"
            className={`transition-opacity duration-300 ${
              stage === "crack" || stage === "split" ? "opacity-100" : "opacity-0"
            }`}
          />
        </svg>
      )}

      {/* Impact Sparks & Flash */}
      {stage === "impact" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-full h-full bg-white/20 blur-xl animate-ping" />
        </div>
      )}

      {/* System Status Text */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 font-display text-xs tracking-[0.35em] uppercase text-neon-cyan transition-opacity duration-300 z-40 ${
          stage === "split" ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="inline-block animate-pulse">
          {stage === "meteor"
            ? "⚡ METEORIC GATE DESCENDING..."
            : stage === "impact" || stage === "crack"
            ? "💥 FRACTURING SYSTEM BARRIER..."
            : "🔓 ARISE, HUNTER..."}
        </span>
      </div>
    </div>
  );
}
