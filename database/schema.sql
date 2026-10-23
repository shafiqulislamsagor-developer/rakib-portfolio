-- ============================================================================
-- Nexfolio Database Schema
-- Compatible with PostgreSQL / MySQL / SQLite & maps to Mongoose ODM models
-- Collections are defined in lib/db/models/ and auto-initialized by Mongoose
-- ============================================================================

-- 1. Users (Admin accounts)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL DEFAULT '',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Sessions (Cookie session authentication)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_agent VARCHAR(255) DEFAULT '',
    ip VARCHAR(45) DEFAULT '',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 3. Profiles (Hero, about, biography and personal branding)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE DEFAULT 'main',
    name VARCHAR(80) NOT NULL DEFAULT '',
    short_name VARCHAR(40) NOT NULL DEFAULT '',
    title VARCHAR(80) NOT NULL DEFAULT '',
    availability VARCHAR(140) NOT NULL DEFAULT '',
    location VARCHAR(120) NOT NULL DEFAULT '',
    email VARCHAR(160) NOT NULL DEFAULT '',
    phone VARCHAR(40) NOT NULL DEFAULT '',
    headline VARCHAR(160) NOT NULL DEFAULT '',
    headline_highlight VARCHAR(60) NOT NULL DEFAULT '',
    intro TEXT,
    about_body TEXT,
    bio TEXT,
    avatar_url VARCHAR(2048) DEFAULT '',
    cv_url VARCHAR(2048) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Projects (Featured case studies and portfolio work)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    content TEXT,
    category VARCHAR(60) DEFAULT '',
    technologies JSON,
    role VARCHAR(120) DEFAULT '',
    client VARCHAR(120) DEFAULT '',
    year VARCHAR(20) DEFAULT '',
    thumbnail_url VARCHAR(2048) DEFAULT '',
    cover_url VARCHAR(2048) DEFAULT '',
    gallery JSON,
    live_url VARCHAR(2048) DEFAULT '',
    repo_url VARCHAR(2048) DEFAULT '',
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- 5. Blog Posts (Markdown blogging engine)
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT,
    cover_url VARCHAR(2048) DEFAULT '',
    tags JSON,
    category VARCHAR(60) DEFAULT '',
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    reading_time_minutes INT DEFAULT 1,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at);

-- 6. Services (Offerings and pricing)
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    summary TEXT,
    description TEXT,
    price_label VARCHAR(60) DEFAULT '',
    deliverables JSON,
    icon VARCHAR(60) DEFAULT 'layers',
    featured BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Skills (Core tech stack)
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    category VARCHAR(60) DEFAULT 'core',
    proficiency INT DEFAULT 80,
    highlighted BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Experience (Employment history)
CREATE TABLE IF NOT EXISTS experiences (
    id VARCHAR(36) PRIMARY KEY,
    role VARCHAR(120) NOT NULL,
    company VARCHAR(120) NOT NULL,
    location VARCHAR(120) DEFAULT '',
    start_date VARCHAR(20) NOT NULL,
    end_date VARCHAR(20) DEFAULT 'Present',
    current BOOLEAN DEFAULT FALSE,
    summary TEXT,
    technologies JSON,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Education (Degrees and certifications)
CREATE TABLE IF NOT EXISTS educations (
    id VARCHAR(36) PRIMARY KEY,
    degree VARCHAR(140) NOT NULL,
    institution VARCHAR(140) NOT NULL,
    field VARCHAR(120) DEFAULT '',
    start_year VARCHAR(20) DEFAULT '',
    end_year VARCHAR(20) DEFAULT '',
    grade VARCHAR(60) DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Testimonials (Client recommendations)
CREATE TABLE IF NOT EXISTS testimonials (
    id VARCHAR(36) PRIMARY KEY,
    client_name VARCHAR(120) NOT NULL,
    client_title VARCHAR(120) DEFAULT '',
    client_company VARCHAR(120) DEFAULT '',
    avatar_url VARCHAR(2048) DEFAULT '',
    quote TEXT NOT NULL,
    rating INT DEFAULT 5,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. FAQs
CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(36) PRIMARY KEY,
    question VARCHAR(240) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(60) DEFAULT 'general',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Media (Images, PDFs and Audio recordings stored with byte streaming support)
CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(36) PRIMARY KEY,
    url VARCHAR(2048) NOT NULL UNIQUE,
    resource_type VARCHAR(20) NOT NULL DEFAULT 'image',
    mime_type VARCHAR(100) NOT NULL,
    bytes BIGINT NOT NULL,
    width INT,
    height INT,
    original_name VARCHAR(255) DEFAULT '',
    alt TEXT DEFAULT '',
    uploaded_by VARCHAR(160) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(resource_type);

-- 13. Messages (Contact form inbox with spam prevention)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    subject VARCHAR(200) DEFAULT '',
    message TEXT NOT NULL,
    phone VARCHAR(60) DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending',
    meta JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- 14. Visitors & Analytics (First-party cookie-less analytics with TTL)
CREATE TABLE IF NOT EXISTS visitors (
    id VARCHAR(36) PRIMARY KEY,
    ip_hash VARCHAR(64) NOT NULL,
    country VARCHAR(100) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    device VARCHAR(60) DEFAULT '',
    browser VARCHAR(60) DEFAULT '',
    os VARCHAR(60) DEFAULT '',
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON visitors(last_seen);

-- 15. Site Settings (Branding, theme, voice greeting, navigation, section copy)
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE DEFAULT 'main',
    site_name VARCHAR(120) DEFAULT 'Nexfolio',
    site_description TEXT,
    site_url VARCHAR(2048) DEFAULT '',
    logo_text VARCHAR(20) DEFAULT '<S/>',
    theme JSON,
    navigation JSON,
    footer JSON,
    home_sections JSON,
    voice_intro JSON,
    analytics JSON,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

