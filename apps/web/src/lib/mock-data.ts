export const hunter = {
  name: "Cyber Tech",
  rank: "S",
  level: 100,
  title: "Shadow Monarch",
  xp: 74999,
  xpMax: 75000,
  hp: 92,
  mp: 68,
  hoursStudied: 87,
  completion: 74,
};

export type CourseStatus = "Completed" | "In Progress" | "Locked";

export const enrolledCourses: {
  title: string;
  level: string;
  progress: number;
  status: CourseStatus;
}[] = [
    { title: "Python for AI", level: "Level 101", progress: 100, status: "Completed" },
    { title: "S-Rank Dungeons 101", level: "Level 203", progress: 62, status: "In Progress" },
    { title: "Skills for AI Hunters", level: "Level 140", progress: 38, status: "In Progress" },
    { title: "Neural Networks & Mana", level: "Level 220", progress: 12, status: "In Progress" },
    { title: "Monarch Class: Cryptography", level: "Level 400", progress: 0, status: "Locked" },
  ];

export const achievements = [
  { name: "Shadow Master", unlocked: true, glyph: "◆" },
  { name: "Dungeon Raider", unlocked: true, glyph: "✦" },
  { name: "Swift Blade", unlocked: true, glyph: "✧" },
  { name: "Rune Scholar", unlocked: false, glyph: "✤" },
  { name: "Gate Breaker", unlocked: false, glyph: "❋" },
  { name: "Monarch", unlocked: false, glyph: "✷" },
];

export const weeklyActivity = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 5 },
  { day: "Wed", hours: 2.5 },
  { day: "Thu", hours: 6 },
  { day: "Fri", hours: 4.5 },
  { day: "Sat", hours: 7.5 },
  { day: "Sun", hours: 3 },
];

export const modules = [
  {
    code: "M1",
    title: "Intro to Hunter Network Security",
    desc: "Basic firewalls, hunter-net concepts and gate hardening.",
    price: 999,
    accent: "cyan" as const,
  },
  {
    code: "M2",
    title: "Cryptographic Runes & Encryption",
    desc: "Securing communiques, rune key pairs and mana ciphers.",
    price: 1199,
    accent: "purple" as const,
  },
  {
    code: "M3",
    title: "Digital Forensics in the Breach",
    desc: "Analyzing digital gate incidents and shadow trails.",
    price: 1299,
    accent: "lime" as const,
  },
  {
    code: "M4",
    title: "Ethical Hacking for Hunters",
    desc: "Testing defenses, exploiting flaws, sealing the system.",
    price: 1499,
    accent: "pink" as const,
  },
];

export const catalogCategories = [
  "Ranks (S, A, B)",
  "Dungeon Types",
  "Master Classes",
  "Mana Control",
  "Basic Classes",
  "System Utilities",
  "Cyber Security",
];

export const passTiers = [
  {
    name: "Starter Pass",
    tag: "E-Rank Awakening",
    price: 1499,
    validity: "3 months access",
    accent: "cyan" as const,
    features: [
      "2 module unlocks",
      "Community gate access",
      "Smart player + notes",
      "Basic progress tracking",
    ],
  },
  {
    name: "Pro Hunter Pass",
    tag: "A-Rank Ascension",
    price: 3999,
    validity: "12 months access",
    popular: true,
    accent: "purple" as const,
    features: [
      "All modules unlocked",
      "AI Teacher Assistant",
      "Live raid classes",
      "Certificate with QR verify",
      "Pomodoro + learning path",
    ],
  },
  {
    name: "Premium Monarch",
    tag: "S-Rank Sovereign",
    price: 7999,
    validity: "Lifetime access",
    accent: "lime" as const,
    features: [
      "Everything in Pro",
      "1:1 instructor Q&A",
      "Priority refund window",
      "Exclusive Monarch bundles",
      "Early access to new gates",
    ],
  },
];

export const instructorFeatures = [
  { title: "AI Course Creation", desc: "Generate outlines, lessons and quizzes from one prompt." },
  { title: "Instructor Dashboard", desc: "Enrolments, ratings and watch-time in a single panel." },
  { title: "Course Builder", desc: "Drag-drop modules, attach resources and set gating rules." },
  { title: "Earnings & Payouts", desc: "Track ₹ revenue share, invoices and withdrawal status." },
  { title: "Q&A Management", desc: "Answer hunter questions with threaded replies and pins." },
  { title: "Instructor Profile", desc: "Public bio, rank badge, credentials and course shelf." },
];

export const studentFeatures = [
  { title: "AI Teacher Assistant", desc: "24/7 tutor that explains lessons in your own words." },
  { title: "Q&A Forum", desc: "Ask the guild, upvote answers and follow topic threads." },
  { title: "Quizzes & Tests", desc: "Timed assessments with instant XP scoring." },
  { title: "Secure Access", desc: "Device limits, watermarking and DRM-protected lessons." },
  { title: "Smart Video Player", desc: "Speed control, notes, bookmarks and resume points." },
  { title: "Wishlist", desc: "Save gates you plan to raid and get price-drop pings." },
  { title: "Progress Tracking", desc: "Per-module completion, streaks and weekly targets." },
  { title: "Certificates (QR)", desc: "Shareable certificates with QR-verifiable authenticity." },
  { title: "Ratings & Reviews", desc: "Rate courses and read verified hunter feedback." },
  { title: "Purchase History", desc: "All invoices, GST breakups and downloadable receipts." },
  { title: "Refunds", desc: "One-tap refund requests with live approval status." },
  { title: "Pomodoro Timer", desc: "Focus raids with break cycles and session stats." },
  { title: "AI Learning Path", desc: "Personalised route from E-Rank to S-Rank mastery." },
  { title: "Payment Gateways", desc: "Cards, UPI, wallets and net banking in ₹ INR." },
  { title: "Live Classes", desc: "Scheduled raids with live chat and recordings." },
  { title: "Course Bundles", desc: "Discounted module packs and full-pathway savings." },
];
