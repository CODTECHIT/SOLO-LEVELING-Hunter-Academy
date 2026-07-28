import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, CreditCard, Smartphone, Sparkles } from "lucide-react";
import { PageShell } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { passTiers } from "@/lib/mock-data";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Hunter Pass Pricing & Checkout — Solo Leveling Academy" },
      {
        name: "description",
        content:
          "Compare Starter, Pro and Premium Hunter Pass tiers, pick a payment method and complete checkout in ₹ INR.",
      },
      { property: "og:title", content: "Hunter Pass Pricing & Checkout" },
      {
        property: "og:description",
        content: "Three ranked passes, UPI / card / net banking checkout, instant unlock.",
      },
    ],
  }),
  component: Pricing,
});

const selected = passTiers[1];
const gst = Math.round(selected.price * 0.18);

function Pricing() {
  return (
    <PageShell
      title="Choose and Activate System"
      subtitle="Pick a Hunter Pass tier, select a payment method and unlock your pathway instantly."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {passTiers.map((t) => (
              <Panel
                key={t.name}
                accent={t.accent}
                hover
                className={`relative flex flex-col ${t.popular ? "md:-mt-3 md:pb-8" : ""}`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-neon-pink/60 bg-background px-3 py-0.5 font-display text-[10px] uppercase tracking-widest text-neon-pink">
                    Most Chosen
                  </span>
                )}
                <p className="font-display text-sm uppercase tracking-widest text-foreground">
                  {t.name}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t.tag}
                </p>
                <p className="mt-4 font-display text-3xl font-bold text-neon">
                  ₹{t.price.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t.validity}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-neon-lime" />
                      <span className="min-w-0">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={t.popular ? "hero" : "neon"} className="mt-6 w-full">
                  {t.popular ? "Activate Pass" : "Select"}
                </Button>
              </Panel>
            ))}
          </div>

          <Panel accent="cyan">
            <PanelTitle>Payment Method</PanelTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Card", sub: "Visa · Mastercard · RuPay", icon: CreditCard, active: true },
                { label: "UPI", sub: "GPay · PhonePe · Paytm", icon: Smartphone, active: false },
                { label: "Net Banking", sub: "All major banks", icon: Building2, active: false },
              ].map((p) => (
                <button
                  key={p.label}
                  className={`hover-glow flex items-center gap-3 rounded-xl border p-4 text-left ${
                    p.active
                      ? "border-neon-cyan/60 bg-neon-cyan/10"
                      : "border-border/70 bg-background/40"
                  }`}
                >
                  <p.icon
                    className={`size-5 shrink-0 ${p.active ? "text-neon-cyan" : "text-muted-foreground"}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-sm text-foreground">
                      {p.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {p.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutInput label="Card Number" placeholder="4242 4242 4242 4242" />
              <CheckoutInput label="Name on Card" placeholder="Sung Jin-Woo" />
              <CheckoutInput label="Expiry" placeholder="09 / 28" />
              <CheckoutInput label="CVV" placeholder="•••" />
            </div>
          </Panel>
        </div>

        <Panel className="h-max lg:sticky lg:top-24">
          <PanelTitle>Order Summary</PanelTitle>
          <ul className="space-y-3 text-sm">
            <Row label={selected.name} value={`₹${selected.price.toLocaleString("en-IN")}`} />
            <Row label="Cyber Security Pathway" value="Included" />
            <Row
              label="Guild discount (10%)"
              value={`-₹${Math.round(selected.price * 0.1).toLocaleString("en-IN")}`}
            />
            <Row label="GST (18%)" value={`₹${gst.toLocaleString("en-IN")}`} />
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
            <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">
              Total
            </span>
            <span className="font-display text-2xl font-bold text-neon-lime glow-text">
              ₹{(selected.price - Math.round(selected.price * 0.1) + gst).toLocaleString("en-IN")}
            </span>
          </div>
          <Button variant="hero" size="xl" className="mt-5 w-full">
            <Sparkles /> Pay Now
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Secured by hunter-grade encryption · 7-day refund window
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="font-display text-foreground">{value}</span>
    </li>
  );
}

function CheckoutInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-neon-cyan/70"
      />
    </label>
  );
}
