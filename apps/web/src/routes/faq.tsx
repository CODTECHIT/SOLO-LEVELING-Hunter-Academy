import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/nav";
import { MessageSquare, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getPublicFaqsFn } from "@/server/courses";

export const Route = createFileRoute("/faq")({
  loader: async () => {
    return await getPublicFaqsFn();
  },
  head: ({ loaderData }) => {
    const faqs = loaderData?.faqs || [];
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f: any) => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer,
        },
      })),
    };

    return {
      meta: [
        { title: "Frequently Asked Questions — Cyber Tech Academy" },
        {
          name: "description",
          content:
            "Find answers to frequently asked questions about Cyber Tech Academy courses, certification, Hunter passes, refunds, and learning tracks.",
        },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Frequently Asked Questions — Cyber Tech Academy" },
        {
          property: "og:description",
          content:
            "Find answers to frequently asked questions about Cyber Tech Academy courses, certification, Hunter passes, refunds, and learning tracks.",
        },
        { property: "og:url", content: "https://www.cybertechacadamy.com/faq" },
        { property: "og:image", content: "https://www.cybertechacadamy.com/logo.png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Frequently Asked Questions — Cyber Tech Academy" },
        {
          name: "twitter:description",
          content:
            "Find answers to frequently asked questions about Cyber Tech Academy courses, certification, Hunter passes, refunds, and learning tracks.",
        },
      ],
      links: [
        { rel: "canonical", href: "https://www.cybertechacadamy.com/faq" },
      ],
      scripts: faqs.length > 0 ? [
        {
          type: "application/ld+json",
          children: JSON.stringify(faqSchema),
        },
      ] : [],
    };
  },
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
