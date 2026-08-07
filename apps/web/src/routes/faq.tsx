import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { MessageSquare, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getPublicFaqsFn } from "@/server/courses";

export const Route = createFileRoute("/faq")({
  loader: async () => {
    return await getPublicFaqsFn();
  },
  head: () => ({
    meta: [{ title: "FAQ — Cyber Tech Academy" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { faqs } = Route.useLoaderData();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <PageShell
      title="Frequently Asked Questions"
      subtitle="Answers to the most common questions about the academy, courses, payments, and more."
    >
      <div className="mx-auto max-w-4xl pb-12">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-6 w-6 text-neon-cyan" />
          <h2 className="font-display text-2xl font-bold text-foreground">Universal FAQ</h2>
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
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
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
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
              No FAQs available yet. Check back soon.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
