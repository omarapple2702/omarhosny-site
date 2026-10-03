// All site content lives here. Everything below comes from pages Omar pointed to
// or details he confirmed himself. Anything not verified is marked `pending: true`
// and is listed in PLACEHOLDERS.md.

export const SITE = {
  url: 'https://www.omarhosny.work.gd',
  name: 'Omar Hosny',
  email: 'contact@omarhosny.work.gd', // linked from Omar Calc's and Dayframe's footers
  tagline: 'Websites, software and projects by Omar Hosny.',
};

export const PROJECTS = [
  {
    slug: 'omar-calculator',
    name: 'Omar Calc',
    kind: 'Website',
    status: 'live',
    statusLabel: 'Live website',
    featured: true,
    summary: 'Type a calculation or equation and get the answer with clear working steps.',
    url: 'https://omar-calc.omarhosny-222.chatgpt.site/',
    urlLabel: 'Open Omar Calc website',
    schema: 'WebApplication',
    category: 'UtilitiesApplication',
    intro:
      'Omar Calc solves everyday maths, linear equations and quadratic equations, and shows the working behind each answer. It runs in the browser, so calculations and history stay on your device.',
    features: [
      'Everyday maths such as totals and percentages.',
      'Linear and quadratic equations in one variable (x, y or z).',
      'Scientific functions including sqrt, sin, cos, tan, ln, log, abs and factorials, with a DEG/RAD switch.',
      'Simplify, differentiate and integrate polynomials with whole-number powers up to 12.',
      'Recent calculations are saved only in your browser.',
      'Works with keyboard and touch.',
    ],
    limits: [
      'No photo scanning or word problems.',
      'No variable denominators, simultaneous equations or non-polynomial equation solving.',
      'Answers use finite-precision arithmetic.',
    ],
    facts: [
      ['Type', 'Website'],
      ['Status', 'Live'],
      ['Privacy', 'Calculations and history stay in your browser'],
    ],
  },
  {
    slug: 'omnidesk',
    name: 'OmniDesk',
    kind: 'Website',
    status: 'dev',
    statusLabel: 'In development',
    summary: 'A local browser desktop for files, notes, tasks, code and a little space to focus.',
    url: 'https://omnidesk.omarhosny-222.chatgpt.site/',
    urlLabel: 'Open OmniDesk website',
    schema: 'WebApplication',
    category: 'ProductivityApplication',
    intro:
      'OmniDesk is a desktop-style workspace that runs locally in your browser. It brings files, notes, tasks and code together, with room to focus.',
    features: ['Files', 'Notes', 'Tasks', 'Code', 'A little space to focus'],
    limits: [],
    notes: ['The site currently identifies itself as a development preview, so features may change.'],
    facts: [
      ['Type', 'Website'],
      ['Status', 'In development'],
      ['Runs', 'Locally in your browser'],
    ],
  },
  {
    slug: 'day-frame',
    name: 'Day Frame',
    kind: 'Website',
    status: 'live',
    statusLabel: 'Live website',
    featured: true,
    summary: 'A personal workspace with your tasks, a focus timer and a notes space in one place.',
    url: 'https://dayframe.omarhosny-222.chatgpt.site/',
    urlLabel: 'Open Day Frame website',
    schema: 'WebApplication',
    category: 'ProductivityApplication',
    intro:
      'Day Frame helps you plan a day around one thing at a time. It keeps your tasks, a focus timer and a space for notes together, and everything is saved in your own browser.',
    features: [
      'A plan for today, with tasks sorted into Study, Projects and Life.',
      'Normal or Important priority, a planned date and optional minutes for each task.',
      'A focus timer with 15, 25 and 50 minute sessions.',
      'A brain dump space for notes and ideas that saves automatically.',
      'Export and restore backups of your data.',
    ],
    limits: [
      'Data is saved in this browser only, so export a backup to keep it.',
      'Keep the tab open for the focus timer’s finish message, because there are no background notifications.',
      'Needs JavaScript for tasks, notes and the timer.',
    ],
    facts: [
      ['Type', 'Website'],
      ['Status', 'Live'],
      ['Privacy', 'Saved in your browser only'],
    ],
  },
  {
    slug: 'welock',
    name: 'WeLock',
    kind: 'macOS app',
    status: 'live',
    statusLabel: 'macOS app',
    featured: true,
    summary: 'A native macOS app that protects chosen apps with Touch\u00a0ID or your Mac login password.',
    url: 'https://welock-website.vercel.app/',
    urlLabel: 'Open WeLock website',
    links: [{ label: 'View WeLock source on GitHub', url: 'https://github.com/Omar-Hosny2702/WeLock' }],
    schema: 'SoftwareApplication',
    category: 'SecurityApplication',
    os: 'macOS 13 or later',
    intro:
      'WeLock lets you protect selected Mac applications with macOS authentication: Touch\u00a0ID when available, with your Mac login password as a fallback. Protection follows the chosen app instead of putting a blocker over everything else. It is written in Swift and SwiftUI.',
    features: [
      'Protect selected installed applications.',
      'Touch\u00a0ID or macOS authentication through LocalAuthentication.',
      'An app-scoped privacy shield instead of a display-wide blocker.',
      'Immediate or delayed re-locking.',
      'Lock on app switching, sleep or session lock, and idle timeout.',
      'Optional auto-close per protected app.',
      'Lock All Now, menu bar controls and launch at login.',
      'Local settings only: no analytics, tracking or remote account.',
    ],
    limits: [
      'Requires macOS\u00a013 or later.',
      'Accessibility permission is recommended for reliable window tracking.',
      'According to the project’s GitHub README, public builds are unsigned and not notarised because the project has no paid Apple Developer Program certificate.',
    ],
    notes: ['WeLock is independently implemented and is not affiliated with MakLock.'],
    facts: [
      ['Type', 'macOS app'],
      ['Latest release', 'V1.2.3'],
      ['Requires', 'macOS\u00a013 or later'],
      ['Built with', 'Swift and SwiftUI'],
      ['Install', 'Direct download or Homebrew, from the WeLock website'],
    ],
  },
  {
    slug: 'terra-view',
    name: 'TerraView',
    kind: 'Website',
    status: 'live',
    statusLabel: 'Live website',
    summary: 'An interactive way to explore Earth, places, local time and public webcams.',
    url: 'https://terraview-rho.vercel.app/',
    urlLabel: 'Open TerraView website',
    schema: 'WebApplication',
    category: 'TravelApplication',
    intro:
      'TerraView is an interactive website for exploring Earth, places, local time and public webcams.',
    features: ['Explore Earth, places and local time.', 'View public webcams.'],
    limits: [],
    facts: [
      ['Type', 'Website'],
      ['Status', 'Live'],
    ],
  },
  {
    slug: 'atlas-ai',
    name: 'Atlas-AI',
    kind: 'Website',
    status: 'live',
    statusLabel: 'Live website',
    summary: 'A chat assistant powered by open-source language models that run on your own machine.',
    url: 'https://atlas-ai-beta-beryl.vercel.app/',
    urlLabel: 'Open Atlas-AI website',
    schema: 'WebApplication',
    category: 'UtilitiesApplication',
    intro:
      'Atlas-AI is a chat assistant. Its site describes it as fast and private, and says it is powered by open-source language models running on your own machine.',
    features: ['A chat assistant.', 'Powered by open-source language models.', 'The models run on your own machine.'],
    limits: [],
    facts: [
      ['Type', 'Website'],
      ['Status', 'Live'],
      ['Models', 'Open source, run on your own machine'],
    ],
  },
  // No public link exists yet, so OmarLink is listed by name only.
  {
    slug: 'omarlink',
    name: 'OmarLink',
    pending: true,
    status: 'none',
    kind: 'Project',
    statusLabel: 'Coming soon',
    summary: 'A project to link a phone and a Mac. It has no public release yet.',
    intro:
      'OmarLink is a project that links a phone and a Mac. It does not have a public release or link yet, so this page does not describe finished features. The animation shows the idea: a phone and a Mac connected, with clipboard, files, screen and notifications passing between them.',
    facts: [
      ['Type', 'Project'],
      ['Status', 'Coming soon'],
      ['Public link', 'None yet'],
    ],
  },
];

// Names come from the old site's Minigames menu.
export const GAMES = [
  'Catch the Falling Apples', 'Response Time', 'Click the Moving Target', 'Minesweeper', 'Flappy Bird',
  'Tetris (Desktop)', 'Snake (Desktop)', 'Chess', 'Clicker', '2048', 'Neon Rush', 'Try to click me (Desktop)',
];

// Exact URLs supplied by Omar. Do not edit these from search results.
export const SOCIALS = [
  { name: 'Instagram', handle: '@omarhosny_222', url: 'https://www.instagram.com/omarhosny_222/' },
  { name: 'TikTok', handle: '@omarhosny_222', url: 'https://www.tiktok.com/@omarhosny_222' },
  { name: 'X', handle: '@omarhosny_222', url: 'https://x.com/omarhosny_222' },
  { name: 'Snapchat', handle: '@omarhosny_222', url: 'https://www.snapchat.com/@omarhosny_222' },
  { name: 'Threads', handle: '@omarhosny_222', url: 'https://www.threads.com/@omarhosny_222' },
  { name: 'Facebook', handle: 'omarhosny222', url: 'https://www.facebook.com/omarhosny222/' },
  { name: 'WhatsApp', handle: '@omarhosny_222', url: 'https://wa.me/@omarhosny_222', noSameAs: true },
];

export const ABOUT = {
  fullName: 'Omar Hosny Mohamed Mostafa Abdelkarim',
  birthplace: 'Alexandria, Egypt',
  certificates: ['Cambridge Lower Secondary', 'Cambridge Primary', 'UCMAS'],
  sports: ['Tennis', 'Swimming (5 stars)'],
};
