export const contact = {
  email: "mr.uiuxmaestro@gmail.com",
  phone: "+8801821-981000",
};

export const menuLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portfolio", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Contact", href: "#contact" },
];

export const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Twitter", href: "https://x.com/" },
];

export const navColumns = [
  [
    { label: "Home", href: "/" },
    { label: "About Me", href: "/about" },
    { label: "Portfolio", href: "/#work" },
    { label: "Services", href: "/#services" },
  ],
  [
    { label: "Blog", href: "/#blog" },
    { label: "Contact", href: "#contact" },
  ],
];

export const navProjects = [
  { index: "01", title: "Business Consultant Website", image: "/images/nav/1.webp", href: "/projects/roofnest", w: 427 },
  { index: "02", title: "Portfolio Website", image: "/images/nav/2.webp", href: "/projects/roofnest", w: 426 },
  { index: "03", title: "Corporate UIUX", image: "/images/nav/3.webp", href: "/projects/roofnest", w: 427 },
];

export const works = [
  { title: "Pay.co Financial", image: "/images/work/payco.webp", tags: ["UI Design", "UX Design"], href: "/projects/roofnest" },
  { title: "Pay.co Financial", image: "/images/work/quickspace.webp", tags: ["UI Design", "UX Design"], href: "/projects/roofnest" },
  { title: "Pay.co Financial", image: "/images/work/interior.webp", tags: ["UI Design", "UX Design"], href: "/projects/roofnest" },
  { title: "Pay.co Financial", image: "/images/work/roofnest.webp", tags: ["UI Design", "UX Design"], href: "/projects/roofnest" },
  { title: "Pay.co Financial", image: "/images/work/animator.webp", tags: ["UI Design", "UX Design"], href: "/projects/roofnest" },
];

export const services = ["UX Research", "Web/Mobile App UI", "SaaS Design", "Brand Design"];

export type Reason = {
  title: string;
  body: string;
  icon: string;
  /** position inside the 1360px wide cards canvas */
  x: number;
  y: number;
  /** distance from the card's top padding to the icon block (design uses space-between) */
  titleWidth?: number;
};

export const reasons: Reason[] = [
  { title: "User's\nValentine", body: "I make users happy and your KPIs happier. Great design isn’t just pretty— it gets results", icon: "/icons/favorite.svg", x: 506, y: 0 },
  { title: "Mobile\nManiac", body: "Designed for thumbs because people scroll like their lives depends on it.", icon: "/icons/dual-screen.svg", x: 0, y: 395 },
  { title: "Developer\n\"friendly\"", body: "Ended the 200 year war between designers and developers. Later I rejected knighthood", icon: "/icons/dev-mode.svg", x: 924, y: 615 },
  { title: "Redesign Master", body: "Client's can't believe it's their old website. They also call me their \"Sensai\"", icon: "/icons/graphic-design.svg", x: 115, y: 996 },
  { title: "\nUX Expert", body: "No dark UX patterns nor dark arts were used. No animals were harmed in this process", icon: "/icons/ux.svg", x: 575, y: 1329 },
  { title: "\nAccessible for all", body: "Yes --- including those who wear double lens spectacles", icon: "/icons/cloud-access.svg", x: 1035, y: 1608 },
];

export const processSteps = [
  { index: "01", title: "Discovery", body: "Throughout my career  I’ve had the privilege of working with some very talented people at a great bunch of companies." },
  { index: "02", title: "Research", body: "We uncover underutilized market possibilities and develop a plan to profit from them. We identify a successful plan by first grasping your markets, consumer motivations, competition strategies, and execution." },
  { index: "01", title: "Strategy", body: "Everything begins with a plan. We will describe your project, establish milestones, and agree on project priorities. We will then have a strategic plan that is consistent with your original vision and makes your objectives attainable. You will meet with our staff to discuss your objectives and desires. From there, we begin to develop an overarching concept and direction." },
  { index: "01", title: "Execute", body: "At this stage, I bring the design to life by creating clean, high-fidelity interfaces using tools like Figma and Framer. Every element is crafted with purpose, ensuring it aligns with user needs and brand goals." },
  { index: "01", title: "Deliver", body: "I prepare all final assets, design systems, and prototypes for handoff, ensuring a smooth transition to development. I stay involved to make sure the final product matches the design vision." },
];

export const testimonials = {
  home: [
    { name: "Sumit Saha", role: "CEO and Co-founder at ABC Comapny", image: "/images/testimonials/home-1.webp" },
    { name: "Sarah", role: "SaaS Startup Founder", image: "/images/testimonials/client-2.webp" },
    { name: "Amira", role: "CEO of Glamii Beauty App", image: "/images/testimonials/home-3.webp" },
  ],
  about: [
    { name: "Sumit Saha", role: "CEO and Co-founder at ABC Comapny", image: "/images/testimonials/about-1.webp" },
    { name: "Sarah", role: "SaaS Startup Founder", image: "/images/testimonials/client-2.webp" },
    { name: "Amira", role: "CEO of Glamii Beauty App", image: "/images/testimonials/about-3.webp" },
  ],
};

export const experiences = [
  { role: "Lead Designer", company: "Originative-lab", from: "2024", to: "2025" },
  { role: "UIUX Designer", company: "Oyolloo", from: "2023", to: "2024" },
  { role: "Junior Designer", company: "Zovo Team", from: "2021", to: "2023" },
  { role: "Intern", company: "Zovo Team", from: "2021", to: "2022" },
];

export const tools = [
  { name: "Figma", icon: "/images/tools/figma.png", x: 287, y: 0, iw: 47.62, ih: 70, ix: 51.19, iy: 26, outline: true },
  { name: "Framer", icon: "/images/tools/framer.png", x: 211, y: 186, iw: 41, ih: 60, ix: 54.74, iy: 31, outline: true },
  { name: "laravel/PHP", icon: "/images/tools/laravel.png", x: 86.69, y: 409.51, iw: 59.02, ih: 60, ix: 45.49, iy: 29.67, outline: false },
  { name: "webflow", icon: "/images/tools/webflow.png", x: 437, y: 327, iw: 70, ih: 49, ix: 40, iy: 36.5, outline: false },
  { name: "React", icon: "/images/tools/react.png", x: 191, y: 372, iw: 70, ih: 61, ix: 40, iy: 29.75, outline: false },
  { name: "wordpress", icon: "/images/tools/wordpress.png", x: 0, y: 245, iw: 60, ih: 60, ix: 45, iy: 31, outline: true },
];
