import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getStudentQuizFn, submitQuizAttemptFn } from "@/server/quizzes";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/_student/quiz/$quizId")({
  loader: async ({ params }) => {
    return await getStudentQuizFn({ data: { quizId: params.quizId } });
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.quiz?.title || "Quiz Assessment"} — Cyber Tech Academy` }],
  }),
  component: StudentQuizPage,
});

function StudentQuizPage() {
  const { quiz, previousSubmissions } = Route.useLoaderData();
  const router = useRouter();

  // Test state: "PREVIEW" | "IN_PROGRESS" | "RESULT"
  const [stage, setStage] = useState<"PREVIEW" | "IN_PROGRESS" | "RESULT">(
    quiz.questions.length > 0 ? "PREVIEW" : "PREVIEW"
  );

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState(quiz.timeLimit * 60);

  useEffect(() => {
    if (stage !== "IN_PROGRESS" || quiz.timeLimit <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, quiz.timeLimit]);

  const handleStartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setSecondsRemaining(quiz.timeLimit * 60);
    setResult(null);
    setStage("IN_PROGRESS");
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const answersArray = quiz.questions.map((q: any) => ({
      questionId: q.id,
      selectedOptionId: selectedAnswers[q.id] || null,
    }));

    try {
      const res = await submitQuizAttemptFn({
        data: {
          quizId: quiz.id,
          answers: answersArray,
        },
      });
      setResult(res);
      setStage("RESULT");
    } catch (err: any) {
      alert(err.message || "Failed to submit quiz attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainderSecs).padStart(2, "0")}`;
  };

  const questions = quiz.questions || [];
  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20 pt-6">
      {/* ---------------- PREVIEW STAGE ---------------- */}
      {stage === "PREVIEW" && (
        <Panel accent="purple" className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neon-purple">
                Knowledge Assessment
              </span>
              <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">{quiz.title}</h1>
            </div>
          </div>

          {quiz.description && (
            <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
              {quiz.description}
            </p>
          )}

          {/* Overview Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl border border-neon-purple/30 bg-surface-2/60 flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.08)]">
              <div className="p-2 rounded-lg bg-neon-purple/10 text-neon-purple mb-1">
                <FileQuestion className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Questions</p>
              <p className="font-display text-2xl font-bold text-foreground mt-0.5">
                {questions.length} <span className="text-xs font-normal text-muted-foreground">Items</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neon-cyan/30 bg-surface-2/60 flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,243,255,0.08)]">
              <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan mb-1">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Time Limit</p>
              <p className="font-display text-2xl font-bold text-neon-cyan mt-0.5">
                {quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : "Untimed"}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-neon-lime/30 bg-surface-2/60 flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(34,197,94,0.08)]">
              <div className="p-2 rounded-lg bg-neon-lime/10 text-neon-lime mb-1">
                <Trophy className="h-5 w-5" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Passing Grade</p>
              <p className="font-display text-2xl font-bold text-neon-lime mt-0.5">
                {quiz.passingScore}% <span className="text-xs font-normal text-muted-foreground">Score</span>
              </p>
            </div>
          </div>

          {/* Previous Attempts History */}
          {previousSubmissions && previousSubmissions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Previous Attempts
              </h3>
              <div className="space-y-2">
                {previousSubmissions.map((sub: any, i: number) => (
                  <div
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border/70 bg-background/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">Attempt #{previousSubmissions.length - i}:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          sub.passed
                            ? "bg-neon-lime/20 text-neon-lime border border-neon-lime/40"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {sub.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <span className="font-bold text-foreground font-mono">
                      {sub.percentage}% ({sub.score}/{sub.totalMarks} pts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
            <Button
              onClick={() => router.history.back()}
              variant="ghost"
              className="text-muted-foreground w-full sm:w-auto"
            >
              Go Back
            </Button>
            <Button
              onClick={handleStartQuiz}
              disabled={questions.length === 0}
              className="bg-neon-purple text-white hover:bg-neon-purple/90 font-bold px-6 w-full sm:w-auto"
            >
              {previousSubmissions?.length > 0 ? "Retake Quiz Now" : "Start Assessment"}
            </Button>
          </div>
        </Panel>
      )}

      {/* ---------------- IN PROGRESS STAGE ---------------- */}
      {stage === "IN_PROGRESS" && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress & Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <div className="w-32 sm:w-36 h-2 bg-surface-2 rounded-full overflow-hidden mt-1.5 border border-border/50">
                <div
                  className="h-full bg-neon-purple transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {quiz.timeLimit > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neon-amber/40 bg-neon-amber/10 text-neon-amber font-mono font-bold text-sm">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}
          </div>

          {/* Question Card */}
          <Panel className="p-4 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon-purple/20 text-neon-purple font-bold text-sm shrink-0 border border-neon-purple/30">
                {currentQIndex + 1}
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground leading-relaxed">
                  {currentQ.question}
                </h2>
                <span className="text-[11px] font-mono text-neon-amber mt-1 inline-block">
                  ({currentQ.marks || 1} mark{currentQ.marks > 1 ? "s" : ""})
                </span>
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-4">
              {currentQ.options?.map((opt: any, idx: number) => {
                const letters = ["A", "B", "C", "D", "E"];
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-neon-purple bg-neon-purple/10 text-foreground font-semibold shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                        : "border-border bg-surface hover:border-border/80 hover:bg-surface-2/40 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-mono font-bold ${
                        isSelected
                          ? "bg-neon-purple text-white"
                          : "bg-surface-2 text-muted-foreground border border-border"
                      }`}
                    >
                      {letters[idx] || idx + 1}
                    </span>
                    <span className="text-sm flex-1">{opt.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Navigation & Submit Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="outline"
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              <div className="flex items-center gap-3">
                {currentQIndex < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="bg-neon-purple text-white hover:bg-neon-purple/90 text-xs px-5"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="bg-neon-lime text-black hover:bg-neon-lime/90 font-bold text-xs px-6 shadow-[0_0_15px_rgba(132,204,22,0.3)]"
                  >
                    {isSubmitting ? "Scoring Assessment..." : "Submit Assessment"}
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ---------------- RESULT STAGE ---------------- */}
      {stage === "RESULT" && result && (
        <div className="space-y-8">
          <Panel
            accent={result.passed ? "lime" : "slate"}
            className="p-8 text-center space-y-6"
          >
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-border/80 bg-surface shadow-xl">
              {result.passed ? (
                <Trophy className="h-10 w-10 text-neon-lime animate-bounce" />
              ) : (
                <AlertCircle className="h-10 w-10 text-neon-amber" />
              )}
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.passed
                    ? "bg-neon-lime/20 text-neon-lime border border-neon-lime/40"
                    : "bg-neon-amber/20 text-neon-amber border border-neon-amber/40"
                }`}
              >
                {result.passed ? "🎉 Congratulations, You Passed!" : "Needs Improvement"}
              </span>
              <h2 className="font-display text-3xl font-bold text-foreground mt-3">
                Score: {result.score} / {result.totalMarks} ({result.percentage}%)
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Passing grade required: {result.passingScore}%
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={handleStartQuiz}
                className="text-xs border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake Quiz
              </Button>
              <Button
                onClick={() => router.history.back()}
                className="bg-neon-purple text-white hover:bg-neon-purple/90 text-xs font-semibold"
              >
                Continue Learning
              </Button>
            </div>
          </Panel>

          {/* Question Breakdown */}
          <div className="space-y-4">
            <h3 className="font-display text-base font-bold text-foreground">
              Detailed Question Analysis
            </h3>
            {result.answers?.map((ans: any, idx: number) => (
              <div
                key={ans.questionId}
                className={`p-5 rounded-xl border space-y-3 ${
                  ans.isCorrect
                    ? "border-neon-lime/40 bg-neon-lime/5"
                    : "border-red-500/40 bg-red-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold shrink-0 mt-0.5 ${
                        ans.isCorrect
                          ? "bg-neon-lime/20 text-neon-lime"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{ans.question}</p>
                      {ans.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          💡 {ans.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${
                      ans.isCorrect
                        ? "border-neon-lime/40 text-neon-lime bg-neon-lime/10"
                        : "border-red-500/40 text-red-400 bg-red-500/10"
                    }`}
                  >
                    {ans.isCorrect ? `+${ans.marks} pts` : "0 pts"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
