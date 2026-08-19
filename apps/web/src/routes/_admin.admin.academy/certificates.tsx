import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  getCertificateTemplatesFn,
  saveCertificateTemplateFn,
  deleteCertificateTemplateFn,
  getAdminIssuedCertificatesFn,
} from "@/server/certificate";
import { getPresignedUrlFn, uploadFileToS3Fn } from "@/server/cms";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { CertificateModal } from "@/components/certificate/CertificateModal";
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Loader2,
  Sparkles,
  CheckCircle,
  Eye,
  FileText,
  Search,
  BookOpen,
  User,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/academy/certificates")({
  loader: async () => {
    try {
      const [templatesData, issuedData] = await Promise.all([
        getCertificateTemplatesFn(),
        getAdminIssuedCertificatesFn(),
      ]);
      return {
        templates: templatesData?.templates || [],
        courses: templatesData?.courses || [],
        certificates: issuedData?.certificates || [],
      };
    } catch (err) {
      console.error("Failed to load certificate data:", err);
      return {
        templates: [],
        courses: [],
        certificates: [],
      };
    }
  },
  head: () => ({
    meta: [{ title: "Certificate Studio — Control Hub" }],
  }),
  component: AdminCertificates,
});

function AdminCertificates() {
  const data = Route.useLoaderData();
  const templates = data?.templates || [];
  const courses = data?.courses || [];
  const initialCertificates = data?.certificates || [];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"TEMPLATES" | "ISSUED">("TEMPLATES");

  // Template form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [signatoryName, setSignatoryName] = useState("Director of Cyber Tech Academy");
  const [signatoryTitle, setSignatoryTitle] = useState("Chief Instructor & Guildmaster");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [sealUrl, setSealUrl] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search in issued list
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  // Preview modal
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const handleUploadImage = async (file: File, type: "template" | "signature" | "seal") => {
    const contentType = file.type || "image/png";
    setIsUploading(true);

    try {
      // 1. Try Direct S3 Presigned URL upload
      const { uploadUrl, publicUrl } = await getPresignedUrlFn({
        data: { filename: file.name, contentType, folder: "certificates" },
      });

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!res.ok) throw new Error(`Direct upload status ${res.status}`);

      if (type === "template") setImageUrl(publicUrl);
      if (type === "signature") setSignatureUrl(publicUrl);
      if (type === "seal") setSealUrl(publicUrl);
      toast.success("Image uploaded to S3 successfully!");
    } catch {
      // 2. Fallback to server-side base64 upload
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        const { publicUrl } = await uploadFileToS3Fn({
          data: {
            filename: file.name,
            base64Data,
            contentType,
            folder: "certificates",
          },
        });

        if (type === "template") setImageUrl(publicUrl);
        if (type === "signature") setSignatureUrl(publicUrl);
        if (type === "seal") setSealUrl(publicUrl);
        toast.success("Image uploaded successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to upload image");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartCreate = () => {
    setEditingId(null);
    setTitle("");
    setImageUrl("");
    setSignatoryName("Director of Cyber Tech Academy");
    setSignatoryTitle("Chief Instructor & Guildmaster");
    setSignatureUrl("");
    setSealUrl("");
    setIsDefault(templates.length === 0);
    setCourseId("");
    setIsEditing(true);
  };

  const handleStartEdit = (t: any) => {
    setEditingId(t.id);
    setTitle(t.title);
    setImageUrl(t.imageUrl || "");
    setSignatoryName(t.signatoryName || "Director of Cyber Tech Academy");
    setSignatoryTitle(t.signatoryTitle || "Chief Instructor & Guildmaster");
    setSignatureUrl(t.signatureUrl || "");
    setSealUrl(t.sealUrl || "");
    setIsDefault(t.isDefault);
    setCourseId(t.courseId || "");
    setIsEditing(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveCertificateTemplateFn({
        data: {
          id: editingId || undefined,
          title: title.trim(),
          imageUrl: imageUrl.trim() || null,
          signatoryName: signatoryName.trim(),
          signatoryTitle: signatoryTitle.trim(),
          signatureUrl: signatureUrl.trim() || null,
          sealUrl: sealUrl.trim() || null,
          isDefault,
          courseId: courseId.trim() || null,
        },
      });
      toast.success(editingId ? "Template updated!" : "Template created!");
      setIsEditing(false);
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate template?")) return;
    try {
      await deleteCertificateTemplateFn({ data: { id } });
      toast.success("Template deleted");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete template");
    }
  };

  const handleLivePreview = (templateData: any) => {
    setPreviewCert({
      id: "preview",
      certificateNo: `CTA-${new Date().getFullYear()}-SAMPLE`,
      issueDate: new Date(),
      user: { name: "Hunter Sung Jin-Woo", email: "hunter@cybertech.academy" },
      course: {
        title: courses.find((c) => c.id === templateData.courseId)?.title || "Shadow Monarch Mastery",
        category: { name: "Elite Awakening" },
      },
    });
    setPreviewTemplate(templateData);
  };

  const filteredCertificates = initialCertificates.filter((cert) => {
    const matchesCourse = !filterCourse || cert.course?.id === filterCourse;
    const matchesSearch =
      !search ||
      cert.certificateNo.toLowerCase().includes(search.toLowerCase()) ||
      cert.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.user?.email.toLowerCase().includes(search.toLowerCase()) ||
      cert.course?.title.toLowerCase().includes(search.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Certificate Studio & Credentials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage certificate templates, customize signatory credentials, and view issued completion certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "TEMPLATES" && !isEditing && (
            <Button variant="hero" onClick={handleStartCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("TEMPLATES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "TEMPLATES"
              ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              : "text-muted-foreground hover:bg-surface-2"
          }`}
        >
          <Award className="h-4 w-4" /> Certificate Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("ISSUED")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "ISSUED"
              ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
              : "text-muted-foreground hover:bg-surface-2"
          }`}
        >
          <CheckCircle className="h-4 w-4" /> Issued Certificates ({initialCertificates.length})
        </button>
      </div>

      {/* TAB 1: TEMPLATES */}
      {activeTab === "TEMPLATES" && (
        <div className="space-y-6">
          {/* Create/Edit Template Form */}
          {isEditing && (
            <Panel accent="purple" className="animate-in slide-in-from-top-4 duration-300">
              <PanelTitle right={<Award className="h-4 w-4 text-neon-purple" />}>
                {editingId ? "Edit Certificate Template" : "New Certificate Template"}
              </PanelTitle>

              <form onSubmit={handleSaveTemplate} className="mt-4 space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Template Title *
                    </label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Official Cyber Tech Academy Certificate"
                      className="w-full rounded-md border border-border bg-background/50 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Course Assignment
                    </label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full rounded-md border border-border bg-background/80 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    >
                      <option value="">Default (Applies to all courses)</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Signatory Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Signatory Name *
                    </label>
                    <input
                      required
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="e.g. Director of Cyber Tech Academy"
                      className="w-full rounded-md border border-border bg-background/50 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Signatory Title / Designation *
                    </label>
                    <input
                      required
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      placeholder="e.g. Chief Instructor & Guildmaster"
                      className="w-full rounded-md border border-border bg-background/50 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    />
                  </div>
                </div>

                {/* Custom Background Image Upload to S3 */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground">
                    Custom Background Template Image (Optional - S3 Upload)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Upload an image (1920x1080 landscape recommended) or leave blank to use the Cyber Tech gold & neon border theme.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... or click upload ->"
                      className="flex-1 rounded-md border border-border bg-background/50 py-2 px-3 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                    />
                    <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-md border border-neon-purple/50 bg-neon-purple/10 px-4 py-2 text-xs font-bold text-neon-purple hover:bg-neon-purple/20 transition-colors shrink-0">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" /> Upload S3 Image
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(file, "template");
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={imageUrl}
                        alt="Template background"
                        className="h-16 w-28 rounded-lg border border-border object-cover"
                      />
                      <span className="text-xs text-muted-foreground break-all">{imageUrl}</span>
                    </div>
                  )}
                </div>

                {/* Is Default Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultCheckbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="accent-[var(--neon-purple)] h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="isDefaultCheckbox" className="text-xs text-foreground font-medium cursor-pointer">
                    Set as system default template
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleLivePreview({
                        title,
                        imageUrl,
                        signatoryName,
                        signatoryTitle,
                        signatureUrl,
                        sealUrl,
                        courseId,
                      })
                    }
                    className="text-xs border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Live Preview
                  </Button>
                  <Button
                    type="submit"
                    variant="neonPurple"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : editingId ? "Update Template" : "Save Template"}
                  </Button>
                </div>
              </form>
            </Panel>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Panel
                key={tpl.id}
                className="flex flex-col justify-between border-border hover:border-neon-purple/50 transition-all bg-surface/80 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-purple/10 border border-neon-purple/40 text-neon-purple">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground group-hover:text-neon-purple transition-colors">
                          {tpl.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {tpl.course ? tpl.course.title : "Global Default"}
                        </p>
                      </div>
                    </div>
                    {tpl.isDefault && (
                      <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Snapshot */}
                  <div
                    className="relative aspect-video w-full rounded-lg border border-border/80 p-4 flex flex-col justify-between overflow-hidden text-center my-3 shadow-inner"
                    style={{
                      background: tpl.imageUrl
                        ? `url(${tpl.imageUrl}) center/cover no-repeat`
                        : "radial-gradient(ellipse at center, #0e1322 0%, #080b14 100%)",
                    }}
                  >
                    <div className="relative z-10">
                      <p className="text-[9px] uppercase tracking-widest text-neon-purple font-bold">
                        Cyber Tech Academy
                      </p>
                      <p className="text-[10px] font-bold text-foreground mt-0.5">
                        CERTIFICATE OF COMPLETION
                      </p>
                    </div>
                    <div className="relative z-10 my-auto">
                      <p className="text-xs font-bold text-neon-cyan">STUDENT NAME</p>
                      <p className="text-[9px] text-muted-foreground truncate max-w-[200px] mx-auto">
                        {tpl.course ? tpl.course.title : "Course Title"}
                      </p>
                    </div>
                    <div className="relative z-10 flex items-center justify-between text-[8px] text-muted-foreground">
                      <span>Date: {new Date().toLocaleDateString()}</span>
                      <span>{tpl.signatoryName}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground mt-2">
                    <p>
                      <strong className="text-foreground">Signatory:</strong> {tpl.signatoryName}
                    </p>
                    <p>
                      <strong className="text-foreground">Designation:</strong> {tpl.signatoryTitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLivePreview(tpl)}
                    className="text-xs text-neon-cyan hover:bg-neon-cyan/10"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(tpl)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="text-red-500 hover:bg-red-500/10 h-8 w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}

            {templates.length === 0 && !isEditing && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <Award className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No certificate templates configured</p>
                <p className="text-xs mt-1">Click "Add Template" above to create your first certificate template.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ISSUED CERTIFICATES */}
      {activeTab === "ISSUED" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student, email, course, or certificate ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
              />
            </div>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <Panel className="p-0 overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <PanelTitle>
                Issued Certificates Log ({filteredCertificates.length})
              </PanelTitle>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/50 font-display text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Certificate ID</th>
                  <th className="px-6 py-4 font-medium">Student / Hunter</th>
                  <th className="px-6 py-4 font-medium">Course Title</th>
                  <th className="px-6 py-4 font-medium">Date Completed</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="transition-colors hover:bg-surface-2/30">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-neon-cyan">
                      {cert.certificateNo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{cert.user?.name}</div>
                      <div className="text-xs text-muted-foreground">{cert.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {cert.course?.title}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(cert.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPreviewCert(cert);
                          setPreviewTemplate(null);
                        }}
                        className="text-neon-purple hover:bg-neon-purple/10 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View & Print
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredCertificates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No issued certificates found. Certificates are generated when students complete 100% of a course.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {previewCert && (
        <CertificateModal
          isOpen={Boolean(previewCert)}
          onClose={() => {
            setPreviewCert(null);
            setPreviewTemplate(null);
          }}
          certificate={previewCert}
          template={previewTemplate}
          studentName={previewCert.user?.name}
          courseTitle={previewCert.course?.title}
        />
      )}
    </div>
  );
}
