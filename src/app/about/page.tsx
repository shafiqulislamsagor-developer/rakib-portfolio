import type { Metadata } from "next";
import { Advantages } from "@/components/about/Advantages";
import { AboutHero, AboutProfile } from "@/components/about/AboutHero";
import { CvSection } from "@/components/about/CvSection";
import { Education, Experience } from "@/components/about/Experience";
import { Nav } from "@/components/Nav";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyConsider } from "@/components/sections/WhyConsider";

export const metadata: Metadata = {
  title: "About",
  description: "Experience, education and toolkit of UI/UX designer Rakib Khan.",
};

export default function AboutPage() {
  return (
    <div className="relative overflow-x-clip">
      <Nav variant="inner" />
      <main>
        <AboutHero />
        <div className="mt-32">
          <AboutProfile />
        </div>
        <div className="mt-32">
          <Experience />
        </div>
        <div className="mt-[220.44px]">
          <Education />
        </div>
        <div className="mt-32">
          <CvSection />
        </div>
        <div className="mt-[136px]">
          <Advantages />
        </div>
        <div className="mt-[136px]">
          <WhyConsider lineOpacity={0.04} />
        </div>
        <div className="mt-[136px]">
          <Testimonials variant="about" />
        </div>
        <div className="mt-[136px]">
          <Contact />
        </div>
      </main>
      <div className="mt-[136px]">
        <Footer variant="inner" contentX={35} discX={623} />
      </div>
    </div>
  );
}
