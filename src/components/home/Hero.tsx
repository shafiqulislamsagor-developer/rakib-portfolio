import Image from "next/image";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative mx-auto h-[924px] w-full max-w-[1440px]">
      <h1 id="hero-title" className="sr-only">
        Rakib Khan — UI/UX Designer
      </h1>

      <p className="absolute top-[418px] left-10 text-[14px] leading-[1.33] whitespace-pre text-g1 uppercase">
        {"/               2025"}
      </p>
      <p className="absolute top-[418px] right-10 text-[14px] leading-[1.33] text-g1 uppercase">Engineering_</p>

      <Image
        src="/type/rakibkhan.svg"
        alt=""
        width={1363}
        height={263}
        unoptimized
        loading="eager"
        className="hero-rise pointer-events-none absolute max-w-none select-none"
        style={{ left: 38.88, top: 536.83 }}
      />
      <Image
        src="/type/uiuxdesigner.svg"
        alt=""
        width={1352}
        height={52}
        unoptimized
        loading="eager"
        className="hero-rise pointer-events-none absolute max-w-none select-none [animation-delay:120ms]"
        style={{ left: 44.25, top: 827.88 }}
      />

      <a
        href="#statement"
        aria-label="Scroll down"
        className="absolute top-[924px] left-[703.06px] z-10 block h-12 w-[33.88px]"
      >
        <span className="absolute inset-0 rounded-[200px] border-[1.5px] border-[#999]" />
        <span className="scroll-dot absolute top-[16.75px] left-[16.19px] h-[10.5px] w-[1.5px] rounded-full bg-white" />
      </a>

      <div
        aria-hidden
        className="pointer-events-none absolute top-[803px] left-0 h-[121px] w-full"
        style={{ background: "linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 104.3%)" }}
      />

      <Image
        src="/brand/logo-glass.svg"
        alt=""
        width={345}
        height={399}
        unoptimized
        loading="eager"
        className="logo-float pointer-events-none absolute max-w-none select-none"
        style={{ left: 547.65, top: 192.73, width: 344.7, height: 398.53 }}
      />
    </section>
  );
}
