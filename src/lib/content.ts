/**
 * Everything the page says lives here. Content only, no behaviour.
 * Editing this file changes the site without touching the engine.
 */

export const links = {
  github: "https://github.com/abhisheksharma611",
  linkedin: "https://www.linkedin.com/in/abhisheksharma611/",
  resume: "/Resume.pdf",
};

export type LedePart = string | { strong: string };

export const hero = {
  greeting: "Hello, I'm",
  name: "ABHISHEK.",
  role: "Aspiring Full Stack Developer",
  lede: [
    "I build ",
    { strong: "web apps and machine-learning tools" },
    " end to end. Python and Flask behind, React and Next.js in front. Everything ships from ",
    { strong: "Mandya, Karnataka" },
    ", and most of it is public on GitHub.",
  ] as LedePart[],
  tagline: "Ships in public",
};

export const bench = [
  {
    title: "Email threat analyzer",
    text: "A local-first spam classifier: fine-tuned RoBERTa plus a scikit-learn ensemble, six classes, risk and sender-reputation scores.",
  },
  {
    title: "ABTalks redesign",
    text: "A 60-day challenge redesign shipped for the Vibe Code Hackathon 2026.",
  },
  {
    title: "AI agents, five days straight",
    text: "Kaggle's vibe-coding intensive, and a portfolio that assembles itself on screen.",
  },
];

export const stats = [
  { value: "9", label: "certifications from IBM, Microsoft, Google and Kaggle" },
  { value: "6", label: "shipped projects, every one public on GitHub" },
  { value: "2023", label: "started B.E. Computer Science at Cauvery Institute of Technology" },
];

export const about = {
  paragraphs: [
    "I'm a Computer Science Engineering student at Cauvery Institute of Technology in Mandya, Karnataka. I build full-stack products with Python and Flask on the back and React and Next.js on the front, and I ship them myself.",
    "Machine learning is the part I keep returning to: my college major project scores 97.3% on a held-out set of 2,055 emails. Every project I finish stays public on GitHub, so the claims can be checked instead of believed.",
  ],
  quote: "If it isn't on GitHub, it isn't finished.",
};

export const timeline = [
  { year: "2021", text: "Finished SSLC with 85.6% and started writing Python for the fun of it." },
  { year: "2023", text: "Passed PUC in Science, then started B.E. Computer Science at Cauvery Institute of Technology, Mandya." },
  { year: "2025", text: "Completed the Deloitte technology job simulation on Forage and the Kaggle Intro to SQL course." },
  { year: "2026", text: "Two hackathons, AI certifications from IBM, Microsoft and Google, and a portfolio that builds itself on screen." },
];

export type Project = {
  name: string;
  kind: string;
  outline?: boolean;
  blurb: string;
  tags: string[];
  href: string;
};

export const projects: Project[] = [
  {
    name: "Spam & threat analyzer",
    kind: "AI / ML",
    blurb:
      "Local-first Gmail analyzer: fine-tuned RoBERTa plus a scikit-learn ensemble, six classes, risk and sender-reputation scores. 97.3% on a held-out set of 2,055 emails.",
    tags: ["Python", "scikit-learn", "Flask"],
    href: "https://github.com/abhisheksharma611/AI-Powered-Email-Spam-Detection-and-Threat-Analysis",
  },
  {
    name: "ABTalks redesign",
    kind: "Web",
    blurb:
      "Redesign of the ABTalks 60-Day Coding Challenge for the Vibe Code Hackathon 2026: a modern, fully responsive interface with refreshed layout and sections.",
    tags: ["TypeScript", "JavaScript", "CSS"],
    href: "https://github.com/abhisheksharma611/abtalks-redesign",
  },
  {
    name: "NexaAI landing page",
    kind: "Web",
    outline: true,
    blurb:
      "A responsive brand landing page with dark-mode toggle, testimonial carousel, scroll-triggered animation, hamburger menu and back-to-top. Plain HTML, CSS and JavaScript.",
    tags: ["HTML", "CSS", "JavaScript"],
    href: "https://github.com/abhisheksharma611/NexaAI-Responsive-Landing-Page",
  },
  {
    name: "Budget app",
    kind: "Python",
    blurb:
      "An OOP budget manager in Python: categories with their own ledgers, guarded withdrawals, transfers between categories and a text-based spending chart.",
    tags: ["Python", "OOP", "Data structures"],
    href: "https://github.com/abhisheksharma611/Expense-Tracker",
  },
  {
    name: "Polygon area calculator",
    kind: "Python",
    outline: true,
    blurb:
      "A geometry toolkit in Python: a Rectangle class, a Square that inherits it, area, perimeter, diagonal, ASCII drawing and how many shapes fit inside another.",
    tags: ["Python", "Inheritance", "Clean code"],
    href: "https://github.com/abhisheksharma611/Polygon-area-calculator-Python",
  },
  {
    name: "This portfolio",
    kind: "Site",
    blurb:
      "A single-page portfolio that assembles itself: eighteen cursors type the copy, wire the blocks and pick the accent colour before you scroll.",
    tags: ["TypeScript", "React", "Motion"],
    href: "https://github.com/abhisheksharma611",
  },
];

export const stack: { label: string; hot?: string; items: string[] }[] = [
  { label: "Frontend", hot: "Next.js", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3"] },
  { label: "Backend & data", hot: "Python", items: ["Python", "Flask", "SQL", "REST APIs", "MySQL", "SQLite", "Git"] },
  { label: "AI & ML", hot: "scikit-learn", items: ["scikit-learn", "PyTorch", "RoBERTa", "Agentic workflows", "Prompt engineering", "LLM tooling"] },
  { label: "Tooling", hot: "GitHub", items: ["GitHub", "VS Code", "OpenCode", "Postman"] },
  { label: "Certifications", items: ["IBM AI Fundamentals", "Microsoft AI Concepts", "Google LLMs", "Kaggle AI Agents", "HackerRank Python", "Kaggle SQL", "IBM Professional Skills", "ViCoDathon 2026"] },
  { label: "Education", items: ["B.E. Computer Science", "Cauvery Institute of Tech", "Govt PU College", "BGS Vidyalaya"] },
];

export const contact = {
  heading: "Got something to build?",
  sub: "I take on full-stack builds, machine-learning projects and open-source collaborations.",
  buttons: [
    { label: "See the code", href: links.github, primary: true },
    { label: "Connect on LinkedIn", href: links.linkedin },
    { label: "Download résumé", href: links.resume },
  ],
};

export const accentNames = ["yellow", "red", "mint", "violet", "orange"] as const;
export type AccentName = (typeof accentNames)[number];

export const accents: Record<AccentName, string> = {
  yellow: "#fff313",
  red: "#ff3348",
  mint: "#3dffb0",
  violet: "#a58bff",
  orange: "#ff6b35",
};

export const finalAccent: AccentName = "orange";
export const finaleWords = ["ABHISHEK", "♥", "LET'S BUILD"];
export const agentCount = 18;
