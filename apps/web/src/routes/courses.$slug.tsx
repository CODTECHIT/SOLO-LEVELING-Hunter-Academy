import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseBySlug } from "@/lib/api-courses";
import { enrollInCourse, checkEnrollment } from "@/lib/api-enrollments";
import { getAuthToken } from "@/lib/api";
import { TopNav, SiteFooter } from "@/components/site/nav";
import { Panel, PanelTitle } from "@/components/site/ui-bits";
import { Button } from "@/components/ui/button";
import { Lock, PlayCircle, Star, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Course — Cyber Tech Academy` },
      { name: "description", content: "View course details and lessons." },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch course details
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => getCourseBySlug(slug),
  });

  const token = getAuthToken();

  // Check if user is enrolled
  const { data: enrollmentStatus } = useQuery({
    queryKey: ["enrollment", course?.id],
    queryFn: () => checkEnrollment(course!.id),
    enabled: !!token && !!course?.id,
  });

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => enrollInCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
      router.navigate({ to: "/dashboard" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
        <p className="mt-4 text-muted-foreground">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Course not found</h1>
        <Link to="/courses">
          <Button variant="neon" className="mt-6">
            Back to Courses
          </Button>
        </Link>
      </div>
    );
  }

  const reviews = course.reviews || [];
  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "No ratings yet";

  const isEnrolled = enrollmentStatus?.isEnrolled || false;

  const handleEnroll = async () => {
    if (!token) {
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
                <div className="inline-flex items-center gap-1.5 rounded-md bg-neon-cyan/10 px-3 py-1 text-sm font-medium text-neon-cyan ring-1 ring-inset ring-neon-cyan/20">
                  {course.category.image && (
                    <img
                      src={course.category.image}
                      alt={course.category.name}
                      className="h-5 w-5 rounded object-cover"
                    />
                  )}
                  {course.category.name}
                </div>
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
              <p className="text-lg text-muted-foreground mb-8">{course.description}</p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-neon-amber fill-neon-amber" />
                  <span className="font-bold text-foreground">{avgRating}</span>
                  <span>({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>{course.lessons.length} Lessons</span>
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
                ₹{course.price.toLocaleString("en-IN")}
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
                30-day refund policy. Secure Razorpay checkout.
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
                  {course.lessons.map((lesson, idx) => (
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
                </div>
              </section>

              {/* Reviews */}
              <section>
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Student Reviews
                </h2>
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground">
                      No reviews yet. Be the first to conquer this dungeon!
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-border p-6 bg-surface/50"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center font-bold font-display uppercase">
                            {review.user.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{review.user.name}</p>
                            <div className="flex gap-1 text-neon-amber mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? "fill-neon-amber" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground text-sm">{review.comment}</p>
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
                  {faqs.map((faq, idx) => (
                    <div
                      key={faq.id}
                      className="rounded-xl border border-border bg-surface overflow-hidden"
                    >
                      <button
                        className="w-full text-left p-4 flex items-center justify-between font-bold text-foreground hover:bg-background/50"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      >
                        {faq.question}
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${openFaq === idx ? "rotate-180" : ""}`}
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
                    <p className="text-sm text-muted-foreground">No FAQs yet for this course.</p>
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
