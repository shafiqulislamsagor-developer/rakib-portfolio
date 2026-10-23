import { DiscLink } from "../kit";

type StatementProps = {
  /** The light-grey opening, with the spinning asterisk dropped in after its first word. */
  headline: string;
  /** The darker continuation of the same sentence. */
  highlight: string;
};

/** "Create ✱ innovative designs…" statement under the hero. */
export function Statement({ headline, highlight }: StatementProps) {
  // Figma sets the asterisk pill in the gap after the first word.
  const [first, ...rest] = headline.split(" ");
  return (
    // sits above the travelling logo so the logo glides behind the words
    <section id="statement" className="relative z-30 mx-auto h-[217px] w-full max-w-[1440px]">
      {/* three 84px lines vertically centred in the 217px frame */}
      <p
        data-reveal="lines"
        className="absolute top-[-22.5px] left-10 w-[1360px] text-center text-[70px] leading-[84px] text-g1"
      >
        {first}
        {/* six spaces wide gap holding the asterisk pill */}
        <span aria-hidden className="relative inline-block h-[1em] w-[1.6464em] align-baseline">
          <svg
            width="83"
            height="50"
            viewBox="0 0 83 50"
            fill="none"
            className="spin-asterisk absolute top-[27.4px] left-[16.5px]"
          >
            <rect width="83" height="50" rx="25" fill="#A1A1A1" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17.4827 24.5L10.1221 20.3419L15.5473 11.1581L22.9122 15.3091L22.9163 7H33.7668L33.771 15.3091L41.1358 11.1581L46.5611 20.3419L39.2004 24.5L46.5611 28.6581L41.1358 37.8419L33.771 33.6909L33.7668 42H22.9163L22.9122 33.6909L15.5473 37.8419L10.1221 28.6581L17.4827 24.5Z"
              fill="black"
            />
          </svg>
        </span>
        {rest.join(" ")} <span className="text-[#515151]">{highlight}</span>
      </p>
      <DiscLink label="Hire Me" href="#contact" style={{ left: 189.04, top: 157 }} />
    </section>
  );
}
