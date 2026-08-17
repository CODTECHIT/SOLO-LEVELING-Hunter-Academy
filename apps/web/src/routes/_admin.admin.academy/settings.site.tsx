import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getSiteSettingsFn, saveSiteSettingsFn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Settings, Search, Globe, type LucideIcon } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_admin/admin/academy/settings/site")({
  loader: async () => {
    return await getSiteSettingsFn();
  },
  component: AdminSettingsSite,
});

function SettingsField({
  label,
  description,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </label>
      {description && <p className="mb-1 text-xs text-muted-foreground/70">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
      />
    </div>
  );
}

function AdminSettingsSite() {
  const { settings } = Route.useLoaderData();
  const router = useRouter();

  const [form, setForm] = useState<Record<string, string>>({
    site_name: settings.site_name ?? "CyberTech Hunter Academy",
    site_logo: settings.site_logo ?? "",
    primary_color: settings.primary_color ?? "#a855f7",
    seo_title: settings.seo_title ?? "CyberTech Hunter Academy",
    seo_description: settings.seo_description ?? "Learn to rise through the ranks.",
    contact_email: settings.contact_email ?? "",
    whatsapp_number: settings.whatsapp_number ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSiteSettingsFn({ data: form });
    setSaving(false);
    router.invalidate();
  };

  const SectionCard = ({
    icon: Icon,
    title,
    children,
  }: {
    icon: LucideIcon;
    title: string;
    children: React.ReactNode;
  }) => (
    <Panel>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-neon-cyan" />
        <PanelTitle className="mb-0">{title}</PanelTitle>
      </div>
      <div className="space-y-4">{children}</div>
    </Panel>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Site Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage global settings for the academy.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Settings} title="General">
          <SettingsField label="Site Name" value={form.site_name} onChange={set("site_name")} />
          <SettingsField
            label="Logo URL"
            description="URL for the academy logo."
            value={form.site_logo}
            onChange={set("site_logo")}
          />
          <SettingsField
            label="Primary Color"
            type="color"
            value={form.primary_color}
            onChange={set("primary_color")}
          />
        </SectionCard>

        <SectionCard icon={Search} title="SEO">
          <SettingsField label="Meta Title" value={form.seo_title} onChange={set("seo_title")} />
          <SettingsField
            label="Meta Description"
            value={form.seo_description}
            onChange={set("seo_description")}
          />
        </SectionCard>

        <SectionCard icon={Globe} title="Contact">
          <SettingsField
            label="Contact Email"
            value={form.contact_email}
            onChange={set("contact_email")}
          />
          <SettingsField
            label="WhatsApp Number"
            value={form.whatsapp_number}
            onChange={set("whatsapp_number")}
          />
        </SectionCard>

        <div className="flex items-end justify-end pb-1">
          <Button type="submit" variant="neon" disabled={saving}>
            <Settings className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
