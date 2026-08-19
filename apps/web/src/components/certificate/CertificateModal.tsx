import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  X,
  Award,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Share2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    id: string;
    certificateNo: string;
    issueDate: string | Date;
    user?: { name: string; email: string };
    course?: { title: string; category?: { name: string } };
  };
  template?: {
    title?: string;
    imageUrl?: string | null;
    signatoryName?: string;
    signatoryTitle?: string;
    signatureUrl?: string | null;
    sealUrl?: string | null;
  } | null;
  studentName?: string;
  courseTitle?: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  certificate,
  template,
  studentName,
  courseTitle,
}: CertificateModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const certContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const recipientName =
    studentName || certificate.user?.name || "Student";
  const displayCourseTitle =
    courseTitle || certificate.course?.title || "Mastery Pathway";
  const issueDateFormatted = new Date(
    certificate.issueDate || Date.now()
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const signatory =
    template?.signatoryName || "Director of Cyber Tech Academy";
  const signatoryRole =
    template?.signatoryTitle || "Chief Instructor & Guildmaster";

  // HTML5 Canvas direct render for 1920x1080 high-res PNG download
  const handleDownloadPNG = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      // 1. Draw Background
      if (template?.imageUrl) {
        try {
          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            bgImg.onload = resolve;
            bgImg.onerror = reject;
            bgImg.src = template.imageUrl!;
          });
          ctx.drawImage(bgImg, 0, 0, 1920, 1080);
        } catch {
          drawDefaultBackground(ctx);
        }
      } else {
        drawDefaultBackground(ctx);
      }

      // 2. Draw Certificate Header
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Academy Name
      ctx.fillStyle = "#A855F7"; // neon purple
      ctx.font = "bold 34px 'Orbitron', 'Inter', sans-serif";
      ctx.fillText("CYBER TECH ACADEMY", 960, 190);

      // Title
      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 64px 'Rajdhani', 'Inter', sans-serif";
      ctx.fillText("CERTIFICATE OF COMPLETION", 960, 270);

      // Subtitle
      ctx.fillStyle = "#94A3B8";
      ctx.font = "24px 'Inter', sans-serif";
      ctx.fillText("THIS RECOGNITION IS OFFICIALLY PRESENTED TO", 960, 360);

      // Student Name
      ctx.fillStyle = "#06B6D4"; // neon cyan
      ctx.font = "bold 76px 'Rajdhani', 'Inter', sans-serif";
      ctx.fillText(recipientName.toUpperCase(), 960, 470);

      // Underline
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(560, 525);
      ctx.lineTo(1360, 525);
      ctx.stroke();

      // Description text
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "24px 'Inter', sans-serif";
      ctx.fillText(
        "for successfully completing all instructional modules, laboratory assignments, and assessments in",
        960,
        580
      );

      // Course Title
      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 44px 'Rajdhani', 'Inter', sans-serif";
      ctx.fillText(`"${displayCourseTitle}"`, 960, 650);

      // Date and Verification Info
      ctx.fillStyle = "#94A3B8";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`DATE OF ISSUANCE: ${issueDateFormatted.toUpperCase()}`, 240, 830);
      ctx.fillText(`VERIFICATION ID: ${certificate.certificateNo}`, 240, 865);
      ctx.fillStyle = "#10B981"; // neon green
      ctx.fillText("✓ VERIFIED ACADEMIC RECORD", 240, 900);

      // Signatory Section
      ctx.textAlign = "right";
      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 26px 'Inter', sans-serif";
      ctx.fillText(signatory, 1680, 840);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.fillText(signatoryRole, 1680, 875);
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillStyle = "#A855F7";
      ctx.fillText("CYBER TECH ACADEMY AUTHORITY", 1680, 905);

      // Convert to downloadable PNG
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CyberTech_Certificate_${recipientName.replace(/\s+/g, "_")}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Certificate downloaded in high resolution!");
      }, "image/png");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate certificate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const drawDefaultBackground = (ctx: CanvasRenderingContext2D) => {
    // Dark luxury slate background
    const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
    bgGrad.addColorStop(0, "#080B14");
    bgGrad.addColorStop(0.5, "#0D1120");
    bgGrad.addColorStop(1, "#080B14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Double Gold/Cyan Futuristic Border
    ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"; // purple outer
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 60, 1800, 960);

    ctx.strokeStyle = "rgba(6, 182, 212, 0.6)"; // cyan inner
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 80, 1760, 920);

    // Corner decorative brackets
    const bracketSize = 40;
    ctx.fillStyle = "#A855F7";
    // top-left
    ctx.fillRect(70, 70, bracketSize, 6);
    ctx.fillRect(70, 70, 6, bracketSize);
    // top-right
    ctx.fillRect(1850 - bracketSize, 70, bracketSize, 6);
    ctx.fillRect(1844, 70, 6, bracketSize);
    // bottom-left
    ctx.fillRect(70, 1004, bracketSize, 6);
    ctx.fillRect(70, 1010 - bracketSize, 6, bracketSize);
    // bottom-right
    ctx.fillRect(1850 - bracketSize, 1004, bracketSize, 6);
    ctx.fillRect(1844, 1010 - bracketSize, 6, bracketSize);

    // Center holographic watermarked seal
    ctx.beginPath();
    ctx.arc(960, 540, 300, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.04)";
    ctx.lineWidth = 40;
    ctx.stroke();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-surface border border-neon-purple/40 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-surface-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-neon-purple/20 border border-neon-purple/50 text-neon-purple">
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                Certificate of Completion
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">
                {certificate.certificateNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs border-border hover:bg-surface-2 hidden sm:inline-flex"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="text-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-3 sm:p-6 overflow-x-auto overflow-y-auto flex items-center justify-center bg-background/60">
          <div
            ref={certContainerRef}
            id="printable-certificate"
            className="relative w-full aspect-[16/9] min-w-[280px] max-w-[860px] rounded-xl border-2 sm:border-4 border-neon-purple/40 p-4 sm:p-8 flex flex-col justify-between text-center overflow-hidden shadow-2xl transition-all"
            style={{
              background: template?.imageUrl
                ? `url(${template.imageUrl}) center/cover no-repeat`
                : "radial-gradient(ellipse at center, #0e1322 0%, #080b14 100%)",
            }}
          >
            {/* Background cyber lines watermark */}
            <div className="absolute inset-2 border border-neon-cyan/30 rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

            {/* Top Header */}
            <div className="relative z-10 pt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShieldCheck className="h-6 w-6 text-neon-purple" />
                <span className="font-display font-extrabold text-sm tracking-[0.25em] text-neon-purple uppercase">
                  Cyber Tech Academy
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-wider uppercase mt-1">
                Certificate of Completion
              </h1>
              <p className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground mt-2">
                This is proudly presented to
              </p>
            </div>

            {/* Student Name */}
            <div className="relative z-10 my-auto py-2">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-neon-cyan tracking-wide drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {recipientName}
              </h2>
              <div className="mx-auto mt-2 h-0.5 w-48 bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
              <p className="mt-3 text-xs sm:text-sm text-foreground/80 max-w-md mx-auto leading-relaxed">
                for successfully completing all instructional modules, practical labs, and curriculum assessments in
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mt-2 text-neon-purple drop-shadow">
                "{displayCourseTitle}"
              </h3>
            </div>

            {/* Footer Signatures & Date */}
            <div className="relative z-10 flex items-end justify-between text-left pt-4 border-t border-border/50">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Date of Completion
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {issueDateFormatted}
                </p>
                <p className="text-[10px] font-mono text-neon-lime flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" /> {certificate.certificateNo}
                </p>
              </div>

              {/* Hologram Badge Stamp */}
              <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-neon-purple/50 bg-neon-purple/10 text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Award className="h-8 w-8" />
              </div>

              <div className="text-right space-y-0.5">
                <div className="h-6 flex items-end justify-end mb-1">
                  {template?.signatureUrl ? (
                    <img
                      src={template.signatureUrl}
                      alt="Signature"
                      className="h-6 w-auto object-contain brightness-125"
                    />
                  ) : (
                    <span className="font-serif italic text-xs text-neon-cyan">
                      {signatory}
                    </span>
                  )}
                </div>
                <div className="border-t border-muted-foreground/40 pt-1">
                  <p className="text-xs font-bold text-foreground">{signatory}</p>
                  <p className="text-[10px] text-muted-foreground">{signatoryRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-border bg-surface-2/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-neon-cyan" /> Authentic Cyber Tech Academy Credential
          </span>
          <span className="font-mono text-[11px]">
            Verification: {certificate.certificateNo}
          </span>
        </div>
      </div>
    </div>
  );
}
