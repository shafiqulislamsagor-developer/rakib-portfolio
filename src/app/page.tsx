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

export default function HomePage() {
  return (
    <div className="relative overflow-x-clip">
      <Nav variant="home" />
      <main>
        {/* the glass logo travels from the hero into the services section */}
        <div className="relative">
          <Hero />
          <div className="mt-32">
            <Statement />
          </div>
          <div className="mt-[187px]">
            <Services />
          </div>
          <HomeLogo />
        </div>
        <div className="mt-32">
          <Work />
        </div>
        <div className="mt-32">
          <AboutIntro />
        </div>
        <WhyConsider />
        <div className="mt-[100px]">
          <Process />
        </div>
        <div className="mt-[100px]">
          <Testimonials />
        </div>
        <Contact />
      </main>
      <div className="mt-[100px]">
        <Footer variant="home" />
      </div>
    </div>
  );
}
