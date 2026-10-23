import type { Metadata } from "next";
import { AboutHero, AboutProfile } from "@/components/about/AboutHero";
import { Advantages } from "@/components/about/Advantages";
import { CvSection } from "@/components/about/CvSection";
import { Education, Experience, type TimelineRow } from "@/components/about/Experience";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyConsider } from "@/components/sections/WhyConsider";
import { getChrome } from "@/lib/chrome";
import { builtInPageMetadata } from "@/lib/content/metadata";
import { getEducation, getExperience, getProfile, getSiteSettings, getSkills, getTestimonials } from "@/lib/content/public";
import { reasons, testimonialCards, tools } from "@/lib/design";
import { formatYear } from "@/lib/format";

export const revalidate = 3600;

export function generateMetadata(): Promise<Metadata> {
  return builtInPageMetadata("about", "/about", "About");
}

export default async function AboutPage() {
  const [chrome, settings, profile, experience, education, skills, testimonials] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getExperience(),
    getEducation(),
    getSkills(),
    getTestimonials(),
  ]);

  const { sectionCopy } = settings;

  const experienceRows: TimelineRow[] = experience.map((job) => ({
    role: job.title,
    company: job.company,
    from: formatYear(job.startDate),
    to: job.endDate ? formatYear(job.endDate) : "Now",
  }));

  const educationRows: TimelineRow[] = education.map((item) => ({
    role: item.title,
    company: item.institution,
    from: item.startDate ? formatYear(item.startDate) : "",
    to: item.endDate ? formatYear(item.endDate) : "Now",
  }));

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" {...chrome.nav} />
      <main>
        <AboutHero name={profile.name} />
        <div className="mt-32">
          <AboutProfile
            eyebrow="Profile"
            // The design opens the paragraph with an italic clause.
            leadItalic="Hello, and welcome to"
            lead={profile.bio.split("\n")[0].replace(/^Hello, and welcome to\s*/i, "")}
            mission={profile.intro}
            approach={profile.aboutBody}
            portrait={{ url: "/images/profile-about.webp", alt: `Portrait of ${profile.name}` }}
          />
        </div>
        {experienceRows.length > 0 && (
          <div className="mt-32">
            <Experience
              eyebrow={sectionCopy.experience.eyebrow}
              heading={sectionCopy.experience.heading}
              intro={sectionCopy.experience.intro}
              rows={experienceRows}
              cvUrl="/cv"
            />
          </div>
        )}
        {educationRows.length > 0 && (
          <div className="mt-[220.44px]">
            <Education
              eyebrow={sectionCopy.education.eyebrow}
              heading={sectionCopy.education.heading}
              intro={sectionCopy.education.intro}
              rows={educationRows}
              cvUrl="/cv"
            />
          </div>
        )}
        <div className="mt-32">
          <CvSection
            eyebrow="my cv"
            heading="Download My CV"
            intro="Get a closer look at my skills, experience, and design journey. Download or preview my CV to explore how I can add value to your next project!"
            cvUrl="/cv"
          />
        </div>
        {tools(skills).length > 0 && (
          <div className="mt-[136px]">
            <Advantages
              eyebrow={sectionCopy.highlights.eyebrow}
              heading={sectionCopy.highlights.heading}
              intro={sectionCopy.highlights.intro}
              tools={tools(skills)}
            />
          </div>
        )}
        {profile.strengths.length > 0 && (
          <div className="mt-[136px]">
            <WhyConsider items={reasons(profile)} lineOpacity={0.04} />
          </div>
        )}
        {testimonials.length > 0 && (
          <div className="mt-[136px]">
            <Testimonials
              eyebrow={sectionCopy.testimonials.eyebrow}
              heading={sectionCopy.testimonials.heading}
              intro={sectionCopy.testimonials.intro}
              items={testimonialCards(testimonials.slice(0, 3))}
            />
          </div>
        )}
        <div className="mt-[136px]">
          <Contact
            eyebrow={sectionCopy.contact.eyebrow}
            heading={sectionCopy.contact.heading}
            intro={sectionCopy.contact.intro}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        </div>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} {...chrome.footer} />
      </div>
    </div>
  );
}
