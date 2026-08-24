import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
  "in", "on", "at", "to", "for", "with", "about", "by", "from", "of",
  "how", "what", "why", "when", "where", "who", "which", "can", "do",
  "does", "did", "i", "you", "my", "me", "we", "they", "this", "that",
  "please", "tell", "explain", "help", "know", "want"
]);

const BUILTIN_FAQS = [
  {
    question: "What is Cyber Tech Academy?",
    answer: "Cyber Tech Academy is an elite Hunter-themed learning platform where engineers and developers conquer real-world masterclasses, level up combat skills in code, and earn cryptographic certificates of mastery.",
    tags: ["academy", "about", "platform", "cyber", "hunter", "what"],
  },
  {
    question: "Do I receive a certificate upon completion?",
    answer: "Yes! Completing 100% of the lessons and assessments in a course automatically unlocks an authenticated, digitally verifiable Certificate of Mastery with unique serial ID and downloadable PDF.",
    tags: ["certificate", "cert", "completion", "degree", "verify", "exam", "pass", "get"],
  },
  {
    question: "How long is my course access valid?",
    answer: "Full Masterclass career paths grant lifetime access with all future updates included. Topic Modules provide 1 full year of access with easy 1-click renewal.",
    tags: ["access", "expiry", "lifetime", "duration", "validity", "year"],
  },
  {
    question: "Can I download lessons for offline study?",
    answer: "Yes! In the mobile app, tap 'Save Offline' on any lesson to save and watch lessons locally in your sandboxed storage without requiring an active internet connection.",
    tags: ["offline", "download", "save", "video", "internet"],
  },
  {
    question: "What payment methods are supported?",
    answer: "We support UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and International Cards through our secure Razorpay payment gateway.",
    tags: ["payment", "pay", "upi", "card", "razorpay", "gpay", "phonepe", "price", "buy"],
  },
  {
    question: "Why is screen recording restricted on videos?",
    answer: "To protect intellectual property and proprietary syllabus material, our media player utilizes hardware-level secure window protection across full-screen playback.",
    tags: ["recording", "screen", "capture", "black", "drm", "protect", "screenshot"],
  },
  {
    question: "How do I get help or contact support if I get stuck?",
    answer: "You can open a support ticket directly from the 'Help & Support' menu, or click 'Open Support Ticket' in this Assistant chat to connect with our instructor team.",
    tags: ["help", "support", "ticket", "stuck", "doubt", "instructor", "contact"],
  },
];

@Injectable()
export class AssistantService {
  constructor(private prisma: PrismaService) {}

  async searchKnowledge(params: {
    courseId?: string;
    lessonId?: string;
    query: string;
  }) {
    const rawQuery = (params.query || "").trim();
    if (!rawQuery) {
      return {
        match: false,
        escalationNeeded: true,
        message: "Please enter a question or topic to search.",
      };
    }

    const queryLower = rawQuery.toLowerCase();

    // 0. Quick conversational greeting checks
    const normalized = queryLower.replace(/[^\w\s]/g, "").trim();
    if (["hi", "hello", "hey", "hola", "greetings", "yo"].includes(normalized)) {
      return {
        match: true,
        answer: "Greetings Hunter! I am ALEX, your AI Tactical Assistant. Ask me anything about our courses, syllabus, certificates, or academy guidelines.",
        matchedQuestion: "Greetings",
        source: "System Assistant",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }
    if (["who are you", "what is your name", "what can you do", "what are you"].includes(normalized)) {
      return {
        match: true,
        answer: "I am ALEX, the Academy's AI Tactical Tutor. I search our course knowledge base, FAQs, and lesson notes to help you level up your skills 24/7.",
        matchedQuestion: "About Assistant",
        source: "System Assistant",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }
    if (["thanks", "thank you", "thx", "appreciate it"].includes(normalized)) {
      return {
        match: true,
        answer: "You're welcome, Hunter! Let me know if you need any other tactical guidance.",
        matchedQuestion: "Acknowledgment",
        source: "System Assistant",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }

    // 0.1 Check for general course catalog inquiries
    const isGeneralCourseQuery = [
      "what courses", "courses available", "available courses", "list of courses",
      "show courses", "course catalog", "which courses", "what can i learn", "all courses", "courses",
      "tell me about courses", "what do you teach"
    ].some((phrase) => queryLower.includes(phrase) || normalized === "courses" || normalized === "course");

    if (isGeneralCourseQuery) {
      const allCourses = await this.prisma.course.findMany({
        select: { id: true, title: true, price: true, description: true },
        take: 10,
      });

      if (allCourses.length > 0) {
        const courseList = allCourses
          .filter((c) => c.title && c.title.length > 2)
          .map((c) => `• ${c.title} (₹${c.price})`)
          .join("\n");

        return {
          match: true,
          answer: `Here are our available training courses:\n\n${courseList}\n\nExplore our Courses page for complete curriculum outlines and enrollments!`,
          matchedQuestion: "Available Courses",
          source: "Course Catalog",
          confidence: "HIGH",
          escalationNeeded: false,
        };
      }
    }

    const words = queryLower
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

    // 1. Fetch Lesson & Course info if provided
    let lesson: any = null;
    let courseId = params.courseId;

    if (params.lessonId) {
      lesson = await this.prisma.lesson.findUnique({
        where: { id: params.lessonId },
        include: { course: true },
      });
      if (lesson && !courseId) {
        courseId = lesson.courseId;
      }
    } else if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (course) {
        lesson = { course };
      }
    }

    // 2. Fetch Relevant FAQs (Course-specific + Global) and merge with BUILTIN_FAQS
    const dbFaqs = await this.prisma.faqItem.findMany({
      where: courseId
        ? {
            OR: [{ courseId }, { courseId: null }],
          }
        : {},
      orderBy: { order: "asc" },
    });

    const allFaqs = [
      ...dbFaqs.map((f) => ({
        question: f.question,
        answer: f.answer,
        tags: [] as string[],
        source: f.courseId ? "Course FAQ" : "Academy FAQ",
        isCourseSpecific: Boolean(f.courseId && f.courseId === courseId),
      })),
      ...BUILTIN_FAQS.map((f) => ({
        question: f.question,
        answer: f.answer,
        tags: f.tags,
        source: "Academy FAQ",
        isCourseSpecific: false,
      })),
    ];

    let bestMatch: any = null;
    let highestScore = 0;

    // 3. Score FAQ matches
    for (const faq of allFaqs) {
      let score = 0;
      const qLower = faq.question.toLowerCase();
      const aLower = faq.answer.toLowerCase();

      // Exact phrase bonus
      if (qLower.includes(queryLower)) {
        score += 15;
      }

      // Keyword hits
      for (const word of words) {
        if (qLower.includes(word)) {
          score += 4;
        }
        if (faq.tags && faq.tags.some((t) => t.toLowerCase().includes(word))) {
          score += 3;
        }
        if (aLower.includes(word)) {
          score += 1.5;
        }
      }

      // Course-specific bonus
      if (faq.isCourseSpecific) {
        score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          answer: faq.answer,
          matchedQuestion: faq.question,
          source: faq.source || "Academy FAQ",
        };
      }
    }

    // 4. Check Lesson summary & description if score is low
    if (lesson && highestScore < 6 && lesson.description) {
      let lessonScore = 0;
      const lTitleLower = (lesson.title || "").toLowerCase();
      const lDescLower = lesson.description.toLowerCase();

      if (lTitleLower.includes(queryLower)) {
        lessonScore += 10;
      }

      for (const word of words) {
        if (lTitleLower.includes(word)) lessonScore += 4;
        if (lDescLower.includes(word)) lessonScore += 2;
      }

      if (lessonScore > highestScore) {
        highestScore = lessonScore;
        bestMatch = {
          answer: lesson.description,
          matchedQuestion: lesson.title,
          source: `Lesson Notes (${lesson.title})`,
        };
      }
    }

    // 4.5. Check Courses in database if score is still low
    if (highestScore < 6) {
      const dbCourses = await this.prisma.course.findMany({
        select: { id: true, title: true, price: true, description: true },
      });

      for (const c of dbCourses) {
        if (!c.title || c.title.length <= 2) continue;
        const cTitleLower = c.title.toLowerCase();
        const cDescLower = (c.description || "").toLowerCase();

        let cScore = 0;
        if (queryLower.includes(cTitleLower) || cTitleLower.includes(queryLower)) {
          cScore += 12;
        }

        for (const word of words) {
          if (cTitleLower.includes(word)) cScore += 5;
          if (cDescLower.includes(word)) cScore += 2;
        }

        if (cScore > highestScore) {
          highestScore = cScore;
          bestMatch = {
            answer: `${c.title} (₹${c.price}):\n\n${c.description}\n\nCheck out the full syllabus in our Courses section to start leveling up!`,
            matchedQuestion: c.title,
            source: "Course Catalog",
          };
        }
      }
    }

    // 5. Evaluate result based on confidence threshold
    const confidenceThreshold = words.length > 0 ? 3 : 5;

    if (bestMatch && highestScore >= confidenceThreshold) {
      return {
        match: true,
        answer: bestMatch.answer,
        matchedQuestion: bestMatch.matchedQuestion,
        source: bestMatch.source,
        confidence: highestScore >= 10 ? "HIGH" : "MEDIUM",
        escalationNeeded: false,
      };
    }

    // 6. No high confidence match -> Return escalation prompt
    const suggestedSubject = lesson?.title
      ? `Lesson Doubt: ${lesson.title}`
      : "General Course Question";

    return {
      match: false,
      escalationNeeded: true,
      message:
        "I couldn't find a direct match in this lesson's knowledge base. Would you like to connect with our Instructor & Support Team?",
      suggestedSubject,
      originalQuery: rawQuery,
    };
  }
}
