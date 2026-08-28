import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { ShieldCheck, Lock, Eye, FileText, Trash2, Mail, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Cyber Tech Academy" },
      {
        name: "description",
        content:
          "Read Cyber Tech Academy's Privacy Policy to understand how we collect, use, protect, and manage your personal data and account information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Privacy Policy — Cyber Tech Academy" },
      {
        property: "og:description",
        content:
          "Read Cyber Tech Academy's Privacy Policy to understand how we collect, use, protect, and manage your personal data.",
      },
      { property: "og:url", content: "https://www.cybertechacadamy.com/privacy-policy" },
      { property: "og:image", content: "https://www.cybertechacadamy.com/logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy — Cyber Tech Academy" },
      {
        name: "twitter:description",
        content:
          "Read Cyber Tech Academy's Privacy Policy to understand how we collect, use, protect, and manage your personal data.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://www.cybertechacadamy.com/privacy-policy" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const lastUpdated = "August 28, 2026";

  return (
    <PageShell
      title="Privacy Policy"
      subtitle={`Last updated: ${lastUpdated}. Learn how Cyber Tech Academy collects, protects, and respects your privacy.`}
    >
      <div className="mx-auto max-w-4xl pb-16 space-y-10 text-foreground/90 leading-relaxed">
        {/* Summary Banner */}
        <div className="rounded-2xl border border-neon-cyan/40 bg-surface-2/70 p-6 backdrop-blur-xl shadow-[0_0_25px_rgba(0,243,255,0.12)]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground tracking-wide">
                Our Privacy Commitment
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Cyber Tech Academy ("we", "our", or "us") is dedicated to safeguarding your privacy. We strictly comply with applicable data protection laws and adhere to Google Play Developer Policies and global security standards. We never sell your personal data.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-neon-purple" />
            <h2 className="font-display text-xl font-bold text-foreground">1. Information We Collect</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We collect information you provide directly when you register an account, enroll in courses, make purchases, or communicate with our support team:
          </p>
          <ul className="space-y-2.5 text-sm text-muted-foreground pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Account Information:</strong> Full name, email address, phone number (optional), and securely hashed passwords.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Educational & Progress Data:</strong> Enrolled courses, completed lessons, video watch time, quiz attempts, scores, and issued certificates.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Payment Information:</strong> Transaction ID, amount paid, and invoice details processed securely via Razorpay. We do not store credit/debit card numbers or UPI PINs on our servers.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
              <span><strong className="text-foreground">Technical & Device Data:</strong> IP address, browser type, operating system version, and general usage analytics collected via Google Analytics to ensure security and prevent unauthorized account sharing.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: How We Use Your Information */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-display text-xl font-bold text-foreground">2. How We Use Your Information</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your personal information is used solely for the following legitimate purposes:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-6">
            <li>Providing access to purchased courses, interactive lessons, and AI Teacher Assistant features.</li>
            <li>Tracking student EXP, Hunter ranks, course completion certificates, and quiz grading.</li>
            <li>Processing payments and sending receipts, invoices, and purchase confirmations.</li>
            <li>Responding to customer support tickets and addressing technical inquiries.</li>
            <li>Detecting fraud, ensuring DRM video protection, and protecting platform integrity.</li>
          </ul>
        </div>

        {/* Section 3: Third-Party Services & Integrations */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-neon-lime" />
            <h2 className="font-display text-xl font-bold text-foreground">3. Third-Party Service Providers</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We partner with industry-leading, compliant third-party infrastructure providers to operate our platform securely:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div className="p-4 rounded-lg border border-border bg-surface-2/60 space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Razorpay</h3>
              <p className="text-xs text-muted-foreground">PCI-DSS Level 1 compliant payment gateway for processing UPI, Cards, Net Banking, and Wallets.</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface-2/60 space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Supabase & PostgreSQL</h3>
              <p className="text-xs text-muted-foreground">Encrypted database storage and authentication services with strict row-level security.</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface-2/60 space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Amazon Web Services (AWS)</h3>
              <p className="text-xs text-muted-foreground">AWS S3, CloudFront CDN, and EC2 servers for high-speed, secure, encrypted video streaming.</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-surface-2/60 space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Google Analytics (G-Tag)</h3>
              <p className="text-xs text-muted-foreground">Aggregated, anonymized website analytics for traffic evaluation and performance monitoring.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Data Security & Retention */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-display text-xl font-bold text-foreground">4. Data Security & Encryption</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All communication between your device (web browser or mobile APK) and our servers is encrypted using <strong>TLS 1.3 / SSL HTTPS</strong>. Passwords are cryptographically hashed using standard <strong>bcrypt</strong> algorithms and are never stored in plaintext. Mobile tokens are preserved inside encrypted device SecureStore storage.
          </p>
        </div>

        {/* Section 5: Data Deletion & User Rights */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="font-display text-xl font-bold text-foreground">5. Account & Data Deletion Rights</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In compliance with Google Play Data Safety requirements and global privacy regulations, you have the right to request access to or complete deletion of your account and personal data at any time.
          </p>
          <div className="p-4 rounded-lg border border-border bg-background/50 text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">How to request data deletion:</strong></p>
            <p>1. Send an email to <a href="mailto:cybertechacademy123@gmail.com" className="text-neon-cyan underline">cybertechacademy123@gmail.com</a> with the subject <em>"Data Deletion Request"</em> from your registered email address.</p>
            <p>2. Or submit a support ticket under the <strong className="text-foreground">Support</strong> tab in your student dashboard.</p>
            <p>Your account, course enrollment records, and personal identifiers will be permanently purged within 30 days of verification.</p>
          </div>
        </div>

        {/* Section 6: Children's Privacy */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-surface/50 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-foreground">6. Children's Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our services are intended for students aged 18 and older, or high school / college students with guardian consent. We do not knowingly collect personally identifiable information from children under the age of 13.
          </p>
        </div>

        {/* Section 7: Contact Us */}
        <div className="space-y-4 rounded-xl border border-neon-cyan/30 bg-surface-2/60 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-neon-cyan" />
            <h2 className="font-display text-xl font-bold text-foreground">7. Contact & Grievance Officer</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            If you have any questions, feedback, or privacy-related concerns, please reach out to us:
          </p>
          <div className="space-y-1.5 text-sm text-foreground">
            <p><strong>Platform:</strong> Cyber Tech Academy</p>
            <p><strong>Email:</strong> <a href="mailto:cybertechacademy123@gmail.com" className="text-neon-cyan underline">cybertechacademy123@gmail.com</a></p>
            <p><strong>Official Website:</strong> <a href="https://www.cybertechacadamy.com" className="text-neon-cyan underline">https://www.cybertechacadamy.com</a></p>
            <p><strong>Help Desk:</strong> <a href="https://www.cybertechacadamy.com/support" className="text-neon-cyan underline">https://www.cybertechacadamy.com/support</a></p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
