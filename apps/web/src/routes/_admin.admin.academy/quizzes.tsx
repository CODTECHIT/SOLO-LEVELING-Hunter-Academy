import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  getAdminQuizzesFn,
  createQuizFn,
  updateQuizFn,
  deleteQuizFn,
  addQuizQuestionFn,
  updateQuizQuestionFn,
  deleteQuizQuestionFn,
  bulkImportQuizQuestionsFn,
  getAdminQuizDetailsFn,
} from "@/server/quizzes";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Layers,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import type { BulkImportQuestionRow } from "@lms/types";


export const Route = createFileRoute("/_admin/admin/academy/quizzes")({
  loader: async () => {
    return await getAdminQuizzesFn();
  },
  head: () => ({
    meta: [{ title: "Quiz Studio — Control Hub" }],
  }),
  component: AdminQuizzesPage,
});

function AdminQuizzesPage() {
  const { quizzes, courses } = Route.useLoaderData();
  const router = useRouter();

  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizDetails, setQuizDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New Quiz Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("NONE");
  const [lessonId, setLessonId] = useState("NONE");
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(60);

  // Question Builder Form State
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetQuizId, setImportTargetQuizId] = useState<string>("");
  const [importRows, setImportRows] = useState<BulkImportQuestionRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load details for a selected quiz
  const handleSelectQuiz = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsLoadingDetails(true);
    try {
      const details = await getAdminQuizDetailsFn({ data: { quizId } });
      setQuizDetails(details);
    } catch (err: any) {
      alert(err.message || "Failed to load quiz details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingQuiz) {
      await updateQuizFn({
        data: {
          quizId: editingQuiz.id,
          title,
          description,
          courseId: courseId !== "NONE" ? courseId : undefined,
          lessonId: lessonId !== "NONE" ? lessonId : undefined,
          timeLimit: Number(timeLimit),
          passingScore: Number(passingScore),
        },
      });
    } else {
      await createQuizFn({
        data: {
          title,
          description,
          courseId: courseId !== "NONE" ? courseId : undefined,
          lessonId: lessonId !== "NONE" ? lessonId : undefined,
          timeLimit: Number(timeLimit),
          passingScore: Number(passingScore),
        },
      });
    }

    setIsCreatingQuiz(false);
    setEditingQuiz(null);
    setTitle("");
    setDescription("");
    router.invalidate();
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? All associated questions and student submissions will be permanently removed.")) return;
    await deleteQuizFn({ data: { quizId } });
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
      setQuizDetails(null);
    }
    router.invalidate();
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setExplanation("");
    setMarks(1);
    setOptions([
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    setIsAddingQuestion(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId || !questionText.trim()) return;
    if (options.filter((o) => o.text.trim()).length < 2) {
      alert("Please provide at least 2 options for the question.");
      return;
    }
    if (!options.some((o) => o.isCorrect)) {
      alert("Please designate at least one correct option.");
      return;
    }

    const cleanOptions = options.filter((o) => o.text.trim()).map((o) => ({
      text: o.text.trim(),
      isCorrect: o.isCorrect,
    }));

    if (editingQuestionId) {
      await updateQuizQuestionFn({
        data: {
          questionId: editingQuestionId,
          question: questionText.trim(),
          explanation: explanation.trim() || undefined,
          marks: Number(marks) || 1,
          options: cleanOptions,
        },
      });
    } else {
      await addQuizQuestionFn({
        data: {
          quizId: selectedQuizId,
          question: questionText.trim(),
          explanation: explanation.trim() || undefined,
          marks: Number(marks) || 1,
          options: cleanOptions,
        },
      });
    }


    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    handleSelectQuiz(selectedQuizId);
    router.invalidate();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Remove this question?")) return;
    await deleteQuizQuestionFn({ data: { questionId } });
    if (selectedQuizId) handleSelectQuiz(selectedQuizId);
    router.invalidate();
  };

  // ---------------- BULK IMPORT PARSER ----------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error("JSON file must be an array of question objects.");
          setImportRows(parsed);
        } else {
          // Parse CSV
          const rows = parseCSVQuestions(text);
          if (rows.length === 0) throw new Error("No valid question rows found in CSV file.");
          setImportRows(rows);
        }
      } catch (err: any) {
        setImportError(err.message || "Failed to parse file.");
        setImportRows([]);
      }
    };
    reader.readAsText(file);
  };

  const parseCSVQuestions = (csvText: string): BulkImportQuestionRow[] => {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    
    // Find column indexes
    const qIdx = headers.findIndex((h) => h.includes("question"));
    const optAIdx = headers.findIndex((h) => h.includes("option a") || h === "a" || h === "option1");
    const optBIdx = headers.findIndex((h) => h.includes("option b") || h === "b" || h === "option2");
    const optCIdx = headers.findIndex((h) => h.includes("option c") || h === "c" || h === "option3");
    const optDIdx = headers.findIndex((h) => h.includes("option d") || h === "d" || h === "option4");
    const correctIdx = headers.findIndex((h) => h.includes("correct") || h.includes("answer"));
    const explIdx = headers.findIndex((h) => h.includes("explanation") || h.includes("hint"));
    const marksIdx = headers.findIndex((h) => h.includes("marks") || h.includes("points") || h.includes("score"));

    const result: BulkImportQuestionRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV splitter that respects quotes
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((val) => val.replace(/^"|"$/g, "").trim()) 
        || lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

      if (!row || row.length === 0) continue;

      const question = qIdx >= 0 ? row[qIdx] : row[0];
      const optionA = optAIdx >= 0 ? row[optAIdx] : row[1];
      const optionB = optBIdx >= 0 ? row[optBIdx] : row[2];
      const optionC = optCIdx >= 0 ? row[optCIdx] : row[3];
      const optionD = optDIdx >= 0 ? row[optDIdx] : row[4];
      const correctOption = correctIdx >= 0 ? row[correctIdx] : (row[5] || "A");
      const explanationText = explIdx >= 0 ? row[explIdx] : row[6];
      const marksVal = marksIdx >= 0 ? Number(row[marksIdx]) : 1;

      if (question && optionA && optionB) {
        result.push({
          question,
          optionA,
          optionB,
          optionC: optionC || "",
          optionD: optionD || "",
          correctOption: correctOption || "A",
          explanation: explanationText || "",
          marks: Number.isNaN(marksVal) ? 1 : marksVal,
        });
      }
    }

    return result;
  };

  const handleDownloadSampleCSV = () => {
    const sample = `Question,Option A,Option B,Option C,Option D,Correct Option,Explanation,Marks
"What is the time complexity of binary search?","O(n)","O(log n)","O(n^2)","O(1)","B","Binary search cuts search space in half each iteration.",1
"Which protocol provides secure encrypted web traffic?","HTTP","FTP","HTTPS","SMTP","C","HTTPS encrypts HTTP traffic via TLS/SSL.",1
"What is the default port for PostgreSQL?","3306","5432","27017","6379","B","PostgreSQL defaults to TCP port 5432.",2`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_quiz_questions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleJSON = () => {
    const sampleJSON = [
      {
        question: "What is the primary advantage of Next.js / SSR?",
        optionA: "Client side only rendering",
        optionB: "Server-side prerendering & SEO optimization",
        optionC: "Automatic SQL query generation",
        optionD: "Replaces database layer",
        correctOption: "B",
        explanation: "Server side rendering produces fully rendered HTML for search engines & fast load.",
        marks: 1,
      },
      {
        question: "In TypeScript, what keyword defines custom structure shapes?",
        optionA: "interface",
        optionB: "structure",
        optionC: "contract",
        optionD: "blueprint",
        correctOption: "A",
        explanation: "The interface keyword declares object shapes in TypeScript.",
        marks: 1,
      },
    ];

    const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_quiz_questions.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    if (!importTargetQuizId) {
      alert("Please select a target quiz.");
      return;
    }
    if (importRows.length === 0) {
      alert("No questions to import.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await bulkImportQuizQuestionsFn({
        data: {
          quizId: importTargetQuizId,
          rows: importRows,
        },
      });
      alert(`Successfully imported ${res.count} questions into the quiz!`);
      setIsImportModalOpen(false);
      setImportRows([]);
      if (selectedQuizId === importTargetQuizId) {
        handleSelectQuiz(importTargetQuizId);
      }
      router.invalidate();
    } catch (err: any) {
      alert(err.message || "Failed to import questions");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quiz & Assessment Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create quizzes, build question sets, and import questions via CSV/JSON spreadsheets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setImportTargetQuizId(quizzes[0]?.id || "");
              setIsImportModalOpen(true);
            }}
            variant="outline"
            className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
          >
            <Upload className="h-4 w-4 mr-2" /> Bulk Import Questions
          </Button>
          <Button
            onClick={() => {
              setEditingQuiz(null);
              setTitle("");
              setDescription("");
              setCourseId("NONE");
              setLessonId("NONE");
              setTimeLimit(15);
              setPassingScore(60);
              setIsCreatingQuiz(true);
            }}
            className="bg-neon-purple text-white hover:bg-neon-purple/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Quiz
          </Button>
        </div>
      </div>

      {/* Main Grid: Quiz List (Left) + Question Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quiz Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              All Quizzes ({quizzes.length})
            </h2>
          </div>

          <div className="space-y-3">
            {quizzes.map((q) => {
              const isSelected = selectedQuizId === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuiz(q.id)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-neon-cyan bg-surface-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border-border bg-surface hover:border-border/80 hover:bg-surface-2/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base leading-snug">{q.title}</h3>
                      {q.course && (
                        <p className="text-xs text-neon-purple mt-1 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {q.course.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQuiz(q);
                          setTitle(q.title);
                          setDescription(q.description || "");
                          setCourseId(q.courseId || "NONE");
                          setLessonId(q.lessonId || "NONE");
                          setTimeLimit(q.timeLimit);
                          setPassingScore(q.passingScore);
                          setIsCreatingQuiz(true);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuiz(q.id);
                        }}
                        className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-neon-cyan" />
                      <strong>{q._count.questions}</strong> Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neon-amber" />
                      {q.timeLimit > 0 ? `${q.timeLimit} Mins` : "No Limit"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-neon-lime" />
                      Pass: {q.passingScore}%
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground/80">
                      {q._count.submissions} Attempts
                    </span>
                  </div>
                </div>
              );
            })}

            {quizzes.length === 0 && (
              <Panel className="p-8 text-center text-muted-foreground">
                <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-semibold text-foreground">No Quizzes Created Yet</p>
                <p className="text-xs mt-1">Click "Create New Quiz" to start building your assessments.</p>
              </Panel>
            )}
          </div>
        </div>

        {/* Right Column: Quiz Question Editor */}
        <div className="lg:col-span-7 space-y-4">
          {selectedQuizId && quizDetails ? (
            <div className="space-y-6">
              <Panel className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-neon-cyan font-semibold">
                      Active Quiz Workspace
                    </span>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">{quizDetails.title}</h2>
                    {quizDetails.description && (
                      <p className="text-xs text-muted-foreground mt-1">{quizDetails.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setImportTargetQuizId(quizDetails.id);
                        setIsImportModalOpen(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="border-neon-cyan/40 text-neon-cyan text-xs"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Bulk Import
                    </Button>
                    <Button
                      onClick={handleOpenAddQuestion}
                      size="sm"
                      className="bg-neon-purple text-white hover:bg-neon-purple/90 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Question
                    </Button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="mt-6 space-y-4">
                  {quizDetails.questions?.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-neon-purple/20 text-neon-purple text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-snug">{q.question}</p>
                            {q.explanation && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                💡 {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-mono text-neon-amber px-2 py-0.5 rounded border border-neon-amber/30 bg-neon-amber/10 mr-1">
                            {q.marks} pt{q.marks > 1 ? "s" : ""}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setQuestionText(q.question);
                              setExplanation(q.explanation || "");
                              setMarks(q.marks || 1);
                              setOptions(
                                q.options.map((o: any) => ({
                                  id: o.id,
                                  text: o.text,
                                  isCorrect: o.isCorrect,
                                }))
                              );
                              setIsAddingQuestion(true);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="h-7 w-7 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                        {q.options.map((opt: any, optIdx: number) => {
                          const letters = ["A", "B", "C", "D", "E"];
                          return (
                            <div
                              key={opt.id || optIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                                opt.isCorrect
                                  ? "border-neon-lime/60 bg-neon-lime/10 text-foreground font-medium"
                                  : "border-border/60 bg-surface text-muted-foreground"
                              }`}
                            >
                              <span className="font-mono font-bold text-[11px] text-muted-foreground">
                                {letters[optIdx] || optIdx + 1}.
                              </span>
                              <span className="flex-1 truncate">{opt.text}</span>
                              {opt.isCorrect && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-neon-lime shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {quizDetails.questions?.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground space-y-3">
                      <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-sm font-semibold text-foreground">No questions in this quiz yet</p>
                      <p className="text-xs">
                        Use "Add Question" to write one or "Bulk Import" to upload multiple via spreadsheet.
                      </p>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          ) : (
            <Panel className="p-12 text-center text-muted-foreground">
              <FileQuestion className="h-12 w-12 mx-auto text-neon-cyan/40 mb-3" />
              <h3 className="font-semibold text-foreground text-lg">Select a Quiz</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Select a quiz from the roster on the left to view questions, edit options, or bulk import questions.
              </p>
            </Panel>
          )}
        </div>
      </div>

      {/* ---------------- CREATE / EDIT QUIZ MODAL ---------------- */}
      {isCreatingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editingQuiz ? "Edit Quiz" : "Create New Quiz"}
              </h3>
              <button
                onClick={() => setIsCreatingQuiz(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React Hooks & Performance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructions for students taking this test..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Course Association
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  >
                    <option value="NONE">Independent / Standalone</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Time Limit (Mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground">0 = Unlimited time</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsCreatingQuiz(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-neon-purple text-white hover:bg-neon-purple/90">
                  {editingQuiz ? "Save Changes" : "Create Quiz"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- QUESTION BUILDER MODAL ---------------- */}
      {isAddingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {editingQuestionId ? "Edit Question" : "Add Question"}
              </h3>
              <button
                onClick={() => setIsAddingQuestion(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the question statement..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Answer Options (Select the correct answer radio)
                </label>
                <div className="space-y-2.5">
                  {options.map((opt, idx) => {
                    const letters = ["A", "B", "C", "D"];
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => {
                              setOptions(
                                options.map((o, i) => ({
                                  ...o,
                                  isCorrect: i === idx,
                                }))
                              );
                            }}
                            className="h-4 w-4 text-neon-lime focus:ring-neon-lime accent-neon-lime"
                          />
                          <span className="font-bold font-mono text-xs text-muted-foreground w-4">
                            {letters[idx]}
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Option ${letters[idx]} text...`}
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...options];
                            next[idx].text = e.target.value;
                            setOptions(next);
                          }}
                          className={`flex-1 rounded-xl border px-3.5 py-2 text-sm text-foreground focus:outline-none ${
                            opt.isCorrect
                              ? "border-neon-lime/60 bg-neon-lime/5 focus:border-neon-lime"
                              : "border-border bg-background focus:border-neon-purple"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Marks / Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Explanation / Solution Hint
                  </label>
                  <input
                    type="text"
                    placeholder="Explanation shown after attempt..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-purple focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsAddingQuestion(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-neon-purple text-white hover:bg-neon-purple/90">
                  {editingQuestionId ? "Save Question" : "Add Question"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- BULK IMPORT MODAL ---------------- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Bulk Question Importer
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Import multiple questions & options instantly via CSV or JSON file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* Target Quiz Selector & Sample Downloads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background/50 p-4 rounded-xl border border-border">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Target Quiz *
                </label>
                <select
                  value={importTargetQuizId}
                  onChange={(e) => setImportTargetQuizId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-neon-cyan focus:outline-none"
                >
                  <option value="">-- Choose Target Quiz --</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sample Templates
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSampleCSV}
                    className="flex-1 text-xs border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSampleJSON}
                    className="flex-1 text-xs border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download JSON
                  </Button>
                </div>
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-neon-cyan/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-surface-2/30 hover:bg-surface-2/60 space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-neon-cyan/60" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Click to select CSV or JSON question file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: CSV (UTF-8) or JSON
                </p>
              </div>
            </div>

            {/* Parse Error Display */}
            {importError && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Parsed Rows Preview */}
            {importRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neon-lime">
                    ✓ Detected {importRows.length} Questions Ready For Import
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-xl p-3 bg-background/50 text-xs">
                  {importRows.map((row, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-border/50 bg-surface/50">
                      <p className="font-semibold text-foreground">
                        {i + 1}. {row.question}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 mt-2 text-muted-foreground text-[11px]">
                        <span>A: {row.optionA}</span>
                        <span>B: {row.optionB}</span>
                        {row.optionC && <span>C: {row.optionC}</span>}
                        {row.optionD && <span>D: {row.optionD}</span>}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-neon-lime">
                        <span>Correct: Option {row.correctOption}</span>
                        {row.marks && <span>Marks: {row.marks}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isImporting || importRows.length === 0 || !importTargetQuizId}
                onClick={handleExecuteImport}
                className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold"
              >
                {isImporting ? "Importing..." : `Import ${importRows.length} Questions`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
