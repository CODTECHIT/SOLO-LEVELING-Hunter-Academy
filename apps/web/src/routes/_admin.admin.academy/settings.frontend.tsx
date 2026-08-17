import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getSiteSettingsFn, saveSiteSettingsFn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/settings/frontend")({
  loader: async () => {
    return await getSiteSettingsFn();
  },
  component: AdminSettingsFrontend,
});

function TextField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
      />
    </div>
  );
}

function AdminSettingsFrontend() {
  const { settings } = Route.useLoaderData();
  const router = useRouter();

  const [form, setForm] = useState<Record<string, string>>({
    hero: settings.hero ?? "CyberTech Hunter Academy",
    hero_subtitle: settings.hero_subtitle ?? "Awaken your potential.",
    hero_cta_label: settings.hero_cta_label ?? "Explore Courses",
    why_choose:
      settings.why_choose ??
      "Train under elite guild instructors, earn ranks, and master cutting-edge skills at your own pace.",
    mission:
      settings.mission ??
      "To shape the next generation of top-tier hunters with world-class education.",
    cta_title: settings.cta_title ?? "Ready to Start Your Hunt?",
    cta_text: settings.cta_text ?? "Join the academy today and begin your journey to S-Rank.",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      <div className="space-y-4">{children}</div>
    </Panel>
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSiteSettingsFn({ data: form });
    setSaving(false);
    router.invalidate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Frontend Manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">Customize public-facing pages.</p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Hero Section">
          <TextField label="Headline" value={form.hero} onChange={set("hero")} rows={2} />
          <TextField
            label="Subtitle"
            value={form.hero_subtitle}
            onChange={set("hero_subtitle")}
            rows={2}
          />
          <TextField
            label="CTA Button Label"
            value={form.hero_cta_label}
            onChange={set("hero_cta_label")}
            rows={1}
          />
        </SectionCard>

        <SectionCard title="Why Choose Us">
          <TextField label="Blurb" value={form.why_choose} onChange={set("why_choose")} />
        </SectionCard>

        <SectionCard title="Our Mission">
          <TextField label="Mission Statement" value={form.mission} onChange={set("mission")} />
        </SectionCard>

        <SectionCard title="CTA Banner">
          <TextField label="Title" value={form.cta_title} onChange={set("cta_title")} rows={2} />
          <TextField label="Text" value={form.cta_text} onChange={set("cta_text")} />
        </SectionCard>

        <div className="flex items-end justify-end pb-1 lg:col-span-2">
          <Button type="submit" variant="neonLime" disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Frontend"}
          </Button>
        </div>
      </form>
    </div>
  );
}
