import { AboutIntro } from "@/components/home/AboutIntro";
import { Hero } from "@/components/home/Hero";
import { HomeLogo } from "@/components/home/HomeLogo";
import { Process } from "@/components/home/Process";
import { Services } from "@/components/home/Services";
import { Statement } from "@/components/home/Statement";
import { Work } from "@/components/home/Work";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyConsider } from "@/components/sections/WhyConsider";
import { getChrome } from "@/lib/chrome";
import { getHomeProjects, getProfile, getServices, getSiteSettings, getTestimonials } from "@/lib/content/public";
import { processSteps, reasons, serviceRows, testimonialCards, works } from "@/lib/design";

// Statically rendered and refreshed on demand whenever content changes in the
// admin panel (see revalidatePath in the admin actions).
export const revalidate = 3600;

export default async function HomePage() {
  const [chrome, settings, profile, projects, services, testimonials] = await Promise.all([
    getChrome(),
    getSiteSettings(),
    getProfile(),
    getHomeProjects(),
    getServices(),
    getTestimonials(),
  ]);

  const { sectionCopy } = settings;
  // Sections can be hidden or reordered in Admin → Settings.
  const shown = (key: string) => settings.homeSections.find((section) => section.key === key)?.visible ?? true;

  return (
    <div className="relative overflow-x-clip">
      <Nav variant="home" {...chrome.nav} />
      <main>
        {/* the glass logo travels from the hero into the services section */}
        <div className="relative">
          <Hero name={profile.name} title={profile.title} />
          <div className="mt-32">
            <Statement headline={profile.headline} highlight={profile.headlineHighlight} />
          </div>
          {shown("services") && (
            <div className="mt-[187px]">
              <Services
                eyebrow={sectionCopy.services.eyebrow}
                intro={sectionCopy.services.intro || profile.intro}
                rows={serviceRows(services)}
              />
            </div>
          )}
          <HomeLogo />
        </div>
        {shown("projects") && projects.length > 0 && (
          <div className="mt-32">
            <Work items={works(projects)} />
          </div>
        )}
        {shown("about") && (
          <div className="mt-32">
            <AboutIntro
              eyebrow={sectionCopy.about.eyebrow}
              heading={sectionCopy.about.heading}
              intro={sectionCopy.about.intro || profile.aboutBody}
              name={profile.name}
              body={profile.intro}
              portrait={profile.avatar}
              cvUrl="/cv"
            />
          </div>
        )}
        {shown("highlights") && profile.strengths.length > 0 && <WhyConsider items={reasons(profile)} />}
        {shown("process") && settings.process.length > 0 && (
          <div className="mt-[100px]">
            <Process
              eyebrow={sectionCopy.process.eyebrow}
              heading={sectionCopy.process.heading}
              intro={sectionCopy.process.intro}
              steps={processSteps(settings)}
            />
          </div>
        )}
        {shown("testimonials") && testimonials.length > 0 && (
          <div className="mt-[100px]">
            <Testimonials
              eyebrow={sectionCopy.testimonials.eyebrow}
              heading={sectionCopy.testimonials.heading}
              intro={sectionCopy.testimonials.intro}
              items={testimonialCards(testimonials.slice(0, 3))}
            />
          </div>
        )}
        {shown("contact") && (
          <Contact
            eyebrow={sectionCopy.contact.eyebrow}
            heading={sectionCopy.contact.heading}
            intro={sectionCopy.contact.intro}
            formEnabled={settings.contact.formEnabled}
            email={profile.email}
          />
        )}
      </main>
      <div className="mt-[100px]">
        <Footer variant="home" {...chrome.footer} />
      </div>
    </div>
  );
}
