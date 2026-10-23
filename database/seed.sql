-- ============================================================================
-- Nexfolio Database Seed Data
-- Demo starter content for reviewing and quick initialization
-- In Node.js/MongoDB: run `pnpm db:seed --yes` to seed directly into MongoDB
-- ============================================================================

-- 1. Default Admin User (Credentials: demo1@gmail.com / demo1)
INSERT INTO users (id, email, name, password_hash, role)
VALUES (
    'usr_01j7q9k4z0000000000000001',
    'demo1@gmail.com',
    'Demo Admin',
    '$2b$10$wE9K6j8vPzV0Y7rYj8Zqhe9F5oZ8K7gX6zP8y9W0V1U2T3S4R5Q6P',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- 2. Starter Profile
INSERT INTO profiles (id, key, name, short_name, title, availability, location, email, headline, headline_highlight, intro)
VALUES (
    'prf_01j7q9k4z0000000000000001',
    'main',
    'Shafiqul Islam Sagor',
    'Shafiqul',
    'Full-Stack Software Engineer',
    'Available for freelance & full-time roles',
    'Dhaka, Bangladesh · Remote Worldwide',
    'demo1@gmail.com',
    'Building modern, high-performance web applications and resilient systems.',
    'high-performance',
    'Software engineer specializing in React, Next.js, Node.js, TypeScript and cloud architecture. Focused on scalable web apps, clean code, and delightful developer experiences.'
) ON CONFLICT (key) DO NOTHING;

-- 3. Core Skills
INSERT INTO skills (id, name, category, proficiency, highlighted, sort_order) VALUES
('skl_01', 'TypeScript', 'core', 95, true, 1),
('skl_02', 'Next.js 15', 'core', 95, true, 2),
('skl_03', 'React 19', 'core', 95, true, 3),
('skl_04', 'Node.js', 'backend', 90, true, 4),
('skl_05', 'Tailwind CSS', 'frontend', 95, true, 5),
('skl_06', 'MongoDB', 'database', 90, true, 6),
('skl_07', 'PostgreSQL', 'database', 85, false, 7),
('skl_08', 'Docker', 'devops', 80, false, 8),
('skl_09', 'GraphQL & REST', 'backend', 90, false, 9),
('skl_10', 'Cloud / Vercel', 'devops', 88, false, 10);

-- 4. Featured Project
INSERT INTO projects (id, title, slug, summary, category, technologies, featured, status, sort_order)
VALUES (
    'prj_01j7q9k4z0000000000000001',
    'Nexfolio Portfolio & CMS Platform',
    'nexfolio-portfolio-platform',
    'A modern developer portfolio platform with a built-in headless CMS, visitor analytics, voice greeting, resume builder, and dark/light theme presets.',
    'Full-Stack Web App',
    '["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "MongoDB"]',
    true,
    'published',
    1
) ON CONFLICT (slug) DO NOTHING;

-- 5. Starter Service
INSERT INTO services (id, title, slug, summary, price_label, icon, featured, sort_order)
VALUES (
    'srv_01j7q9k4z0000000000000001',
    'Full-Stack Web Application Development',
    'full-stack-web-dev',
    'Custom, production-ready web apps built with Next.js, React, Node.js and MongoDB. Fast, responsive, accessible and SEO optimized from day one.',
    'Starting from $1,200',
    'layers',
    true,
    1
) ON CONFLICT (slug) DO NOTHING;

-- 6. Starter FAQ
INSERT INTO faqs (id, question, answer, category, sort_order)
VALUES (
    'faq_01j7q9k4z0000000000000001',
    'Are you available for freelance or contract work?',
    'Yes! I am currently accepting selected contract work, freelance projects, and full-time engineering opportunities. Feel free to reach out via the contact form.',
    'general',
    1
);

-- 7. Default Settings
INSERT INTO settings (id, key, site_name, site_description, logo_text, theme, voice_intro)
VALUES (
    'set_01j7q9k4z0000000000000001',
    'main',
    'Nexfolio',
    'Full-stack developer portfolio platform built with Next.js, React, TypeScript and MongoDB.',
    '<S/>',
    '{"defaultMode": "system", "preset": "violet"}',
    '{"enabled": true, "url": "", "label": "Play my welcome", "autoplay": true, "oncePerSession": false}'
) ON CONFLICT (key) DO NOTHING;

