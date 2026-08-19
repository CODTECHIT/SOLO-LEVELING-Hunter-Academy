import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { getCourseFn, submitReviewFn } from "@/server/courses";
import { enrollInCourse } from "@/lib/api-enrollments";
import { getAuthToken } from "@/lib/api";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Lock,
  PlayCircle,
  Star,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Send,
  LogIn,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params }) => {
    return await getCourseFn({ data: { slug: params.slug } });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.course?.title ?? "Course"} — Cyber Tech Academy` },
      {
        name: "description",
        content:
          loaderData?.course?.description ?? "View course details and lessons.",
      },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const courseResponse = Route.useLoaderData();
  const course = (courseResponse as any)?.course ?? courseResponse;
  const currentUser = courseResponse?.currentUser;
  const token = getAuthToken();

  const reviews = course.reviews || [];
  const faqs = (course as any).faqs || [];
  const lessons = course.lessons || [];
  const isEnrolled = Boolean(courseResponse?.isEnrolled);

  // User's existing review
  const existingReview = currentUser
    ? reviews.find(
        (r: any) =>
          r.userId === currentUser.id || r.user?.id === currentUser.id
      )
    : null;

  // Review Form State
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => enrollInCourse(courseId),
    onSuccess: () => {
      router.invalidate();
      router.navigate({ to: "/dashboard" });
    },
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in to submit a review");
      router.navigate({ to: "/login" });
      return;
    }

    try {
      setIsSubmittingReview(true);
      await submitReviewFn({
        data: {
          courseId: course.id,
          rating,
          comment: comment.trim(),
        },
      });
      toast.success(
        existingReview
          ? "Your review has been updated!"
          : "Thank you! Your review has been published."
      );
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Course not found
        </h1>
        <Link to="/courses">
          <Button variant="neon" className="mt-6">
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (
        reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "No ratings yet";

  const handleEnroll = async () => {
    if (!token && !currentUser) {
      router.navigate({ to: "/login" });
      return;
    }

    enrollMutation.mutate(course.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Header Section */}
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 mb-16 items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {course.category?.name && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-neon-cyan/10 px-3 py-1 text-sm font-medium text-neon-cyan ring-1 ring-inset ring-neon-cyan/20">
                    {(course.category as any)?.image && (
                      <img
                        src={(course.category as any).image}
                        alt={course.category.name}
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    {course.category.name}
                  </div>
                )}

                {course.type === "MODULE" ? (
                  <div className="inline-flex items-center rounded-md bg-neon-amber/10 px-3 py-1 text-sm font-medium text-neon-amber ring-1 ring-inset ring-neon-amber/20">
                    Hunter Pass Module
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-md bg-neon-purple/10 px-3 py-1 text-sm font-medium text-neon-purple ring-1 ring-inset ring-neon-purple/20">
                    Full Course
                  </div>
                )}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {course.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-neon-amber fill-neon-amber" />
                  <span className="font-bold text-foreground">{avgRating}</span>
                  <span>({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>{lessons.length} Lessons</span>
                </div>
              </div>
            </div>

            <Panel accent="cyan" className="sticky top-24 p-6">
              <div className="aspect-video w-full bg-surface-2 rounded-xl overflow-hidden mb-6 relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt="Preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neon-cyan/20">
                    <PlayCircle className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-background/50 backdrop-blur border border-border flex items-center justify-center text-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                    <PlayCircle className="w-8 h-8 ml-1" />
                  </div>
                </div>
              </div>

              <div className="text-3xl font-display font-bold text-foreground mb-6">
                ₹{(course.price || 0).toLocaleString("en-IN")}
              </div>

              {isEnrolled ? (
                <Link to="/learn/$courseId" params={{ courseId: course.slug }}>
                  <Button variant="neonPurple" className="w-full py-6 text-lg">
                    Continue Learning
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="hero"
                  className="w-full py-6 text-lg"
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Enroll Now"
                  )}
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground mt-4">
                Secure Razorpay checkout. Immediate access upon registration.
              </p>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
            <div className="space-y-12">
              {/* Course Content */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Course Content
                </h2>
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  {lessons.map((lesson: any, idx: number) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {idx === 0 ? (
                          <PlayCircle className="w-5 h-5 text-neon-cyan" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-foreground">
                          {idx + 1}. {lesson.title}
                        </p>
                      </div>
                      {lesson.duration && (
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(lesson.duration / 60)}:
                          {String(lesson.duration % 60).padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No lessons uploaded yet for this course.
                    </p>
                  )}
                </div>
              </section>

              {/* Reviews Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Student Reviews ({reviews.length})
                  </h2>
                </div>

                {/* Logged-In User Review Submission Form */}
                {currentUser ? (
                  <Panel accent="amber" className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">
                          {existingReview
                            ? "Update Your Review"
                            : "Rate & Review This Course"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Share your experience and learnings with fellow hunters.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-neon-amber font-semibold">
                        Logged in as: {currentUser.name}
                      </span>
                    </div>

                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Star Rating Picker */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Your Rating:
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled =
                              (hoverRating !== null ? hoverRating : rating) >=
                              starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onMouseEnter={() => setHoverRating(starVal)}
                                onMouseLeave={() => setHoverRating(null)}
                                onClick={() => setRating(starVal)}
                                className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                              >
                                <Star
                                  className={`w-7 h-7 transition-colors ${
                                    isFilled
                                      ? "fill-neon-amber text-neon-amber drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                                      : "text-muted-foreground/30 hover:text-muted-foreground"
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="ml-3 font-display text-sm font-bold text-neon-amber">
                            {(hoverRating !== null ? hoverRating : rating)}.0 / 5
                          </span>
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Feedback & Comment (Optional):
                        </label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="How did this dungeon training help you? What rank did you achieve?"
                          className="w-full rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground focus:border-neon-amber focus:outline-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="neon"
                        disabled={isSubmittingReview}
                        className="px-6"
                      >
                        {isSubmittingReview ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {existingReview
                              ? "Update Review"
                              : "Post Review"}
                          </>
                        )}
                      </Button>
                    </form>
                  </Panel>
                ) : (
                  /* Login Prompt for Non-Logged In Users */
                  <Panel className="p-6 text-center space-y-3 bg-surface-2/40 border-dashed">
                    <MessageSquare className="h-8 w-8 text-neon-amber mx-auto opacity-80" />
                    <div>
                      <h4 className="font-display text-base font-bold text-foreground">
                        Want to rate & review this course?
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Please sign in to your hunter account to post feedback, rate instructors, and share your experience.
                      </p>
                    </div>
                    <Link to="/login">
                      <Button variant="outline" size="sm" className="mt-2 text-xs">
                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        Log In to Write a Review
                      </Button>
                    </Link>
                  </Panel>
                )}

                {/* Reviews List */}
                <div className="space-y-4 pt-2">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No reviews yet. Be the first to conquer this dungeon!
                    </p>
                  ) : (
                    reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-border p-6 bg-surface/50"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold font-display uppercase">
                            {review.user?.name
                              ? review.user.name.substring(0, 2)
                              : "AN"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {review.user?.name || "Anonymous Hunter"}
                            </p>
                            <div className="flex gap-1 text-neon-amber mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating
                                      ? "fill-neon-amber text-neon-amber"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* FAQ */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq: any, idx: number) => (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-border bg-surface overflow-hidden"
                    >
                      <button
                        className="w-full text-left p-4 flex items-center justify-between font-bold text-foreground hover:bg-background/50"
                        onClick={() =>
                          setOpenFaq(openFaq === idx ? null : idx)
                        }
                      >
                        {faq.question}
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            openFaq === idx ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {openFaq === idx && (
                        <div className="p-4 pt-0 text-muted-foreground text-sm border-t border-border/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No FAQs yet for this course.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
