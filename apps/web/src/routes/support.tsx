import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, Mail, Send } from "lucide-react";
import { useState } from "react";
import { getPublicFaqsFn } from "@/server/courses";

export const Route = createFileRoute("/support")({
  loader: async () => {
    return await getPublicFaqsFn();
  },
  head: () => ({
    meta: [{ title: "Support — Cyber Tech Academy" }],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { faqs } = Route.useLoaderData();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageShell
      title="Hunter Support"
      subtitle="Need assistance with the system? Browse our FAQs or contact the admins directly."
    >
      <div className="mx-auto max-w-4xl space-y-12 pb-12">
        {/* FAQs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-6 w-6 text-neon-cyan" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="rounded-xl border border-border bg-surface overflow-hidden transition-all hover:border-border/80"
              >
                <button
                  className="w-full text-left p-5 flex items-center justify-between font-bold text-foreground hover:bg-background/50"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.question}
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-muted-foreground text-sm border-t border-border/50 bg-background/30 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
            {faqs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No FAQs available yet. Check back soon.
              </p>
            )}
          </div>
        </section>

        {/* Contact Form & WhatsApp */}
        <div className="grid md:grid-cols-2 gap-8">
          <Panel accent="purple">
            <PanelTitle>Contact System Admins</PanelTitle>
            <form
              className="space-y-4 mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Message sent successfully!");
              }}
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  placeholder="Cyber Tech"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  placeholder="hunter@system.local"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none focus:ring-1 focus:ring-neon-purple"
                  placeholder="Describe your issue..."
                ></textarea>
              </div>
              <Button type="submit" variant="neonPurple" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </form>
          </Panel>

          <div className="space-y-6">
            <Panel accent="cyan" className="h-full flex flex-col justify-center text-center p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-8 w-8"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.573c-.199 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Instant Support
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Get immediate assistance from our support team via WhatsApp. We typically reply
                within minutes.
              </p>
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20"
              >
                Chat on WhatsApp
              </a>
            </Panel>

            <Panel accent="slate" className="text-center p-6">
              <Mail className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">Email us directly</p>
              <a
                href="mailto:cybertechacademy123@gmail.com"

                className="text-neon-cyan hover:underline mt-1 block"
              >
                cybertechacademy123@gmail.com

              </a>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
