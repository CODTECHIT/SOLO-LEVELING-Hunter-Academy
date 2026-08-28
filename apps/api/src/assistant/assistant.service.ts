import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were",
  "in", "on", "at", "to", "for", "with", "about", "by", "from", "of",
  "how", "what", "why", "when", "where", "who", "which", "can", "do",
  "does", "did", "i", "you", "my", "me", "we", "they", "this", "that",
  "please", "tell", "explain", "help", "know", "want"
]);

const BUILTIN_KNOWLEDGE_TOPICS: {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}[] = [
  // Academy Core & Progression
  {
    keywords: ["cyber tech", "academy", "platform", "hunter", "what is cyber tech", "about platform"],
    question: "What is Cyber Tech Academy?",
    answer: "Cyber Tech Academy is an elite Hunter-themed learning platform designed for engineers and developers to master real-world software engineering, level up combat skills in code, conquer boss quizzes, and earn cryptographic Certificates of Mastery.",
    category: "Academy Core",
  },
  {
    keywords: ["certificate", "cert", "completion", "verify", "exam", "pass", "download cert", "degree"],
    question: "How do I earn and verify my Certificate of Mastery?",
    answer: "Completing 100% of the lessons and assessments in any course automatically generates an authenticated, digitally verifiable Certificate of Mastery with a unique serial ID, blockchain-ready verification link, and high-resolution downloadable PDF.",
    category: "Certifications",
  },
  {
    keywords: ["rank", "exp", "level", "hunter rank", "progression", "shadow monarch", "dungeon raider"],
    question: "How does the Hunter Ranking & EXP system work?",
    answer: "You earn EXP by completing video lessons (+25 EXP), scoring high on chapter quizzes (+50 EXP), and completing entire courses (+200 EXP). As your EXP increases, your Hunter Rank upgrades: E-Rank Recruit ➔ D-Rank Scout ➔ C-Rank Striker ➔ B-Rank Vanguard ➔ A-Rank Elite ➔ S-Rank Monarch!",
    category: "Hunter Progression",
  },
  {
    keywords: ["hp", "mp", "streak", "focus", "stats", "overdrive"],
    question: "What do HP (Focus) and MP (Streak) measure?",
    answer: "• HP (Focus): Measures video watch completeness and course thoroughness.\n• MP (Streak): Daily learning momentum. Studying consecutive days maintains your streak (7 days = 100% Overdrive mode).",
    category: "Hunter Progression",
  },
  {
    keywords: ["offline", "download", "save video", "no internet", "sandbox"],
    question: "Can I download lessons for offline study?",
    answer: "Yes! In the mobile app, tap the 'Save Offline' download button on any supported lesson. The video is securely cached to your sandboxed device storage for high-speed playback anywhere without an active internet connection.",
    category: "Mobile App",
  },
  {
    keywords: ["screen recording", "screenshot", "black screen", "security policy", "flag secure", "drm"],
    question: "Why is screen recording restricted on videos?",
    answer: "To protect proprietary academy syllabus and course content, our mobile media player enforces hardware-level secure window protection across full-screen playback. Screen recordings and screenshots result in a black screen by policy.",
    category: "Security",
  },
  {
    keywords: ["payment", "razorpay", "upi", "card", "price", "buy course", "fees", "cost", "emi"],
    question: "What payment methods are supported?",
    answer: "We support instant UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ banks, and International Cards via our 256-bit encrypted Razorpay gateway.",
    category: "Billing",
  },
  {
    keywords: ["access", "validity", "expiry", "subscription", "how long", "duration", "365"],
    question: "How long is my course access valid?",
    answer: "All courses and career paths provide 365 days (1 full year) of complete access from the enrollment date, with simple 1-click renewal.",
    category: "Enrollment",
  },
  {
    keywords: ["support", "ticket", "help", "contact", "instructor", "stuck", "doubt"],
    question: "How do I connect with an instructor or get help?",
    answer: "You can open a priority support ticket anytime from the 'Help & Support' tab or click 'Escalate to Support' directly inside this AI Assistant. Our engineering instructors review questions within 2-4 hours.",
    category: "Support",
  },

  // Programming & Web Development Knowledge
  {
    keywords: ["javascript", "js", "closure", "prototype", "hoisting", "event loop"],
    question: "What is JavaScript and how do closures work?",
    answer: "JavaScript is a versatile, event-driven programming language that powers modern web development.\n\n• Closure: A function bundled together with references to its surrounding lexical environment, allowing an inner function to remember and access variables from an outer function even after that outer function has finished executing.",
    category: "JavaScript",
  },
  {
    keywords: ["typescript", "ts", "types", "interface", "generic", "type safety"],
    question: "What are the core benefits of TypeScript?",
    answer: "TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript. Key advantages include:\n1. Static Type Checking: Catch errors at compile time before running code in production.\n2. IDE Autocompletion: Rich IntelliSense and refactoring support.\n3. Interfaces & Generics: Build robust, reusable architectural components.",
    category: "TypeScript",
  },
  {
    keywords: ["react", "hooks", "usestate", "useeffect", "usememo", "virtual dom", "component"],
    question: "How does React manage state with Hooks?",
    answer: "React is a component-driven UI library using a virtual DOM for optimized rendering.\n• useState: Manages local component reactive state.\n• useEffect: Handles side effects like data fetching, subscriptions, or DOM mutations.\n• useMemo / useCallback: Caches expensive calculations and callback references across re-renders.",
    category: "React",
  },
  {
    keywords: ["nextjs", "next.js", "ssr", "ssg", "server component", "app router"],
    question: "What is Next.js and why use Server Components?",
    answer: "Next.js is a full-stack React framework providing Server-Side Rendering (SSR), Static Site Generation (SSG), and React Server Components (RSC). Server Components execute on the server to keep large dependencies off the client bundle, improving page load speeds and SEO.",
    category: "Next.js",
  },
  {
    keywords: ["node", "nodejs", "backend", "express", "nestjs", "rest api"],
    question: "What is Node.js and how does the event loop work?",
    answer: "Node.js is an asynchronous, event-driven JavaScript runtime built on Chrome's V8 engine. It uses a single-threaded Event Loop with non-blocking I/O, allowing servers to handle thousands of concurrent requests efficiently using libuv worker threads for I/O tasks.",
    category: "Node.js",
  },
  {
    keywords: ["prisma", "database", "orm", "postgres", "postgresql", "sql", "migration"],
    question: "What is Prisma ORM and how does it connect to PostgreSQL?",
    answer: "Prisma is a next-generation TypeScript Object-Relational Mapper (ORM) that provides declarative schema modeling, automated migrations (`prisma migrate`), and type-safe database client queries (`prisma.course.findMany()`) with connection pooling for PostgreSQL, MySQL, and SQLite.",
    category: "Databases",
  },
  {
    keywords: ["git", "github", "commit", "branch", "pull request", "merge", "rebase"],
    question: "What are the essential Git commands for developers?",
    answer: "• git clone <url>: Clone a repository.\n• git checkout -b <branch>: Create and switch to a feature branch.\n• git add . && git commit -m \"message\": Stage and commit changes.\n• git push origin <branch>: Push branch to remote.\n• git pull --rebase: Fetch and sync upstream changes cleanly.",
    category: "DevOps & Tools",
  },
  {
    keywords: ["async", "await", "promise", "asynchronous", "try catch", "fetch"],
    question: "How do Promises and Async/Await work in JavaScript?",
    answer: "A Promise represents an operation that hasn't completed yet (Pending ➔ Fulfilled or Rejected).\n\nAsync/Await is syntactic sugar over Promises that allows asynchronous code to be written in a clean, synchronous-looking style with standard `try...catch` blocks for robust error handling.",
    category: "JavaScript",
  },
  {
    keywords: ["python", "pip", "django", "fastapi", "machine learning", "ai"],
    question: "What makes Python so popular for AI and Backend development?",
    answer: "Python features clean, readable syntax and a massive ecosystem of specialized libraries: FastAPI/Django for high-performance APIs, and PyTorch, TensorFlow, NumPy, and Pandas for Machine Learning, Data Science, and AI agent engineering.",
    category: "Python",
  },
  {
    keywords: ["security", "auth", "jwt", "token", "cors", "xss", "csrf"],
    question: "How is authentication secured in web and mobile applications?",
    answer: "Modern apps use JSON Web Tokens (JWT) or secure HttpOnly cookies for stateless session validation, encrypted passwords using bcrypt/Argon2, strict CORS policies, input sanitization against XSS, and parameterized SQL queries to prevent SQL injection.",
    category: "Cybersecurity",
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
        message: "Please ask a question or enter a topic to explore.",
      };
    }

    const queryLower = rawQuery.toLowerCase();
    const normalized = queryLower.replace(/[^\w\s]/g, "").trim();

    // 0. Quick conversational greeting checks
    if (["hi", "hello", "hey", "hola", "greetings", "yo", "sup"].includes(normalized)) {
      return {
        match: true,
        answer: "Greetings Hunter! ⚔️ I am ALEX, your AI Tactical Assistant. Ask me anything about course lessons, coding concepts (JS, React, Python, Backend), certificates, exams, or academy guidance!",
        matchedQuestion: "Greetings",
        source: "ALEX AI Tutor",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }

    if (["who are you", "what is your name", "what can you do", "what are you", "help me"].includes(normalized)) {
      return {
        match: true,
        answer: "I am ALEX, the Academy's AI Tactical Tutor! 🤖\n\nI provide 24/7 assistance on:\n• Course curriculum & lesson breakdowns\n• Code debugging & programming explanations (JavaScript, TypeScript, React, Python, Databases)\n• Quizzes, Certifications, and Hunter Rank guides\n• 1-tap support escalation if you need human instructor review.",
        matchedQuestion: "About Assistant",
        source: "ALEX AI Tutor",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }

    if (["thanks", "thank you", "thx", "appreciate it", "great"].includes(normalized)) {
      return {
        match: true,
        answer: "You're welcome, Hunter! Keep pushing your skills forward. Let me know if you need any other tactical guidance! 🚀",
        matchedQuestion: "Acknowledgment",
        source: "ALEX AI Tutor",
        confidence: "HIGH",
        escalationNeeded: false,
      };
    }

    // 1. Fetch Lesson & Course info if provided
    let lesson: any = null;
    let course: any = null;
    let courseId = params.courseId;

    if (params.lessonId) {
      lesson = await this.prisma.lesson.findUnique({
        where: { id: params.lessonId },
        include: { course: true },
      });
      if (lesson) {
        course = lesson.course;
        courseId = course?.id;
      }
    } else if (courseId) {
      course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
    }

    // 2. Try Gemini Generative AI if an API Key is present in environment
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || process.env.GEMINI_KEY;
    if (geminiApiKey) {
      try {
        const aiResponse = await this.queryGeminiAI(geminiApiKey, rawQuery, course, lesson);
        if (aiResponse) {
          return {
            match: true,
            answer: aiResponse,
            matchedQuestion: rawQuery,
            source: "ALEX Generative AI",
            confidence: "HIGH",
            escalationNeeded: false,
          };
        }
      } catch (geminiError) {
        // Fall through to database knowledge search
      }
    }

    // 3. Check for general course catalog inquiries
    const isGeneralCourseQuery = [
      "what courses", "courses available", "available courses", "list of courses",
      "show courses", "course catalog", "which courses", "what can i learn", "all courses", "courses",
      "tell me about courses", "what do you teach"
    ].some((phrase) => queryLower.includes(phrase) || normalized === "courses" || normalized === "course");

    if (isGeneralCourseQuery) {
      const allCourses = await this.prisma.course.findMany({
        select: { id: true, title: true, price: true, description: true },
        take: 8,
      });

      if (allCourses.length > 0) {
        const courseList = allCourses
          .filter((c) => c.title && c.title.length > 2)
          .map((c) => `• ${c.title} (₹${c.price})`)
          .join("\n");

        return {
          match: true,
          answer: `Here are our active academy masterclasses & combat tracks:\n\n${courseList}\n\nExplore our Courses catalog for complete syllabi, hands-on projects, and instant enrollments!`,
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

    // 4. Match against BUILTIN_KNOWLEDGE_TOPICS
    let bestMatch: any = null;
    let highestScore = 0;

    for (const topic of BUILTIN_KNOWLEDGE_TOPICS) {
      let score = 0;
      const qLower = topic.question.toLowerCase();
      const aLower = topic.answer.toLowerCase();

      if (qLower.includes(queryLower)) score += 15;

      for (const kw of topic.keywords) {
        if (queryLower.includes(kw)) score += 10;
      }

      for (const word of words) {
        if (qLower.includes(word)) score += 4;
        if (topic.keywords.some((k) => k.includes(word))) score += 3;
        if (aLower.includes(word)) score += 1.5;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          answer: topic.answer,
          matchedQuestion: topic.question,
          source: topic.category,
        };
      }
    }

    // 5. Query Database FAQs safely
    try {
      if ((this.prisma as any).faqItem) {
        const dbFaqs = await (this.prisma as any).faqItem.findMany({
          where: courseId ? { OR: [{ courseId }, { courseId: null }] } : {},
          orderBy: { order: "asc" },
        });

        for (const faq of dbFaqs) {
          let score = 0;
          const qLower = faq.question.toLowerCase();
          const aLower = faq.answer.toLowerCase();

          if (qLower.includes(queryLower)) score += 15;

          for (const word of words) {
            if (qLower.includes(word)) score += 4;
            if (aLower.includes(word)) score += 1.5;
          }

          if (faq.courseId && faq.courseId === courseId) score += 3;

          if (score > highestScore) {
            highestScore = score;
            bestMatch = {
              answer: faq.answer,
              matchedQuestion: faq.question,
              source: faq.courseId ? "Course FAQ" : "Academy FAQ",
            };
          }
        }
      }
    } catch (faqErr) {
      console.warn("DB FAQ search skipped:", faqErr);
    }

    // 6. Check Lesson Notes & Description safely
    try {
      if (lesson && lesson.description) {
        let lessonScore = 0;
        const lTitleLower = (lesson.title || "").toLowerCase();
        const lDescLower = lesson.description.toLowerCase();

        if (lTitleLower.includes(queryLower)) lessonScore += 12;

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
    } catch (lessonErr) {
      console.warn("Lesson notes search skipped:", lessonErr);
    }

    // 7. Check Courses in DB safely
    try {
      if (highestScore < 5 && this.prisma.course) {
        const dbCourses = await this.prisma.course.findMany({
          select: { id: true, title: true, price: true, description: true },
        });

        for (const c of dbCourses) {
          if (!c.title || c.title.length <= 2) continue;
          const cTitleLower = c.title.toLowerCase();
          const cDescLower = (c.description || "").toLowerCase();

          let cScore = 0;
          if (queryLower.includes(cTitleLower) || cTitleLower.includes(queryLower)) cScore += 12;

          for (const word of words) {
            if (cTitleLower.includes(word)) cScore += 4;
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
    } catch (courseErr) {
      console.warn("Course search skipped:", courseErr);
    }

    // 8. Return Best Match if Confidence is Good
    if (bestMatch && highestScore >= 3) {
      return {
        match: true,
        answer: bestMatch.answer,
        matchedQuestion: bestMatch.matchedQuestion,
        source: bestMatch.source,
        confidence: highestScore >= 8 ? "HIGH" : "MEDIUM",
        escalationNeeded: false,
      };
    }

    // 9. Intelligent Fallback Answer
    const intelligentFallback = this.generateIntelligentFallback(rawQuery, course, lesson);
    return {
      match: true,
      answer: intelligentFallback,
      matchedQuestion: rawQuery,
      source: "ALEX Knowledge Engine",
      confidence: "MEDIUM",
      escalationNeeded: false,
    };
  }

  private async queryGeminiAI(
    apiKey: string,
    prompt: string,
    course?: any,
    lesson?: any
  ): Promise<string | null> {
    const context = `You are ALEX, an elite Cyber Tech Academy AI Tutor and engineering mentor.
Context:
${course ? `Course: ${course.title}` : ""}
${lesson ? `Lesson: ${lesson.title}` : ""}
Provide a clear, concise, highly educational, and encouraging answer with code examples or steps where helpful.
Format with clean bullet points or numbered lists where appropriate. Keep it concise (under 200 words).`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${context}\n\nStudent Question: ${prompt}` },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  }

  private generateIntelligentFallback(query: string, course?: any, lesson?: any): string {
    const prefix = lesson?.title
      ? `Regarding your question in "${lesson.title}":`
      : course?.title
      ? `Regarding your inquiry for "${course.title}":`
      : "Here is tactical guidance on your inquiry:";

    return `${prefix}\n\n• For programming or architectural questions, ensure syntax, types, and asynchronous calls are properly handled.\n• Review the lesson notes, attached downloadable assets, and chapter exercises.\n• If you need detailed code debugging or personal guidance, use the 'Escalate to Support' option below to connect with our instructor engineering team!`;
  }
}
