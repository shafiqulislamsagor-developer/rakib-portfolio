import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRight(props: IconProps) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden {...props}>
      <path
        d="M6.03814 2.70084C6.47814 3.25884 6.84014 3.71084 7.22414 4.17384H0.994141V5.26984H7.21414C6.82914 5.72184 6.46614 6.17484 6.03814 6.72184L4.66414 8.45784H6.03814L8.99414 4.70984L6.03814 0.964844H4.66414L6.03814 2.70084Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden {...props}>
      <path d="M7.9998 11.7L4.2998 8V6.3L7.2998 9.3V1H8.6998V9.3L11.6998 6.3V8L7.9998 11.7Z" fill="currentColor" />
      <path d="M2.4002 13.9H1.2002V11L2.4002 12V13.9ZM13.6002 13.9H14.8002V11L13.6002 12V13.9Z" fill="currentColor" />
      <path d="M14.8002 13.7002V14.9002H1.2002V13.7002H14.8002Z" fill="currentColor" />
    </svg>
  );
}

export function ArrowUpRightSmall(props: IconProps) {
  return (
    <svg width="11" height="10.14" viewBox="0 0 11 10.14" fill="none" aria-hidden {...props}>
      <path
        d="M1.15755 0H10.3858V8.87457L9.0675 10.0964V5.56268C9.0675 4.43729 9.0675 3.32796 9.08358 2.20257L0.916396 10.1286L0 9.13181L8.19933 1.20578C7.07393 1.22186 5.94854 1.22186 4.82314 1.22186H0L1.15755 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** mdi-light:arrow-up rotated, used next to project titles. Drawn on an 84px grid. */
export function ArrowUpRightLarge(props: IconProps) {
  return (
    <svg viewBox="0 0 84 84" fill="none" aria-hidden {...props}>
      <path
        d="M22.6888 59.6513L54.6817 27.6583L27.2592 27.6583L27.0241 23.9759H60.9759V57.9276L57.2934 57.6925L57.2934 30.27L25.3004 62.263L22.6888 59.6513Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Same glyph as drawn inside the 48px frame next to smaller project titles. */
export function ArrowUpRight48(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <path
        transform="matrix(0.70711 0.70711 -0.70711 0.70711 26 -11)"
        d="M22.1608 52.2994L22.1608 7.05451L2.7701 26.4452L0 24.0075L24.0075 0L48.015 24.0075L45.2449 26.4452L25.8542 7.05451L25.8542 52.2994L22.1608 52.2994Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MenuLines(props: IconProps) {
  return (
    <svg width="70" height="14" viewBox="0 0 70 14" fill="none" aria-hidden {...props}>
      <line y1="0.75" x2="70" y2="0.75" stroke="currentColor" strokeWidth="1.5" />
      <line x1="27" y1="12.75" x2="70" y2="12.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CloseLines(props: IconProps) {
  return (
    <svg width="70" height="17" viewBox="0 0 70 17" fill="none" aria-hidden {...props}>
      <line
        y1="-0.75"
        x2="70"
        y2="-0.75"
        transform="matrix(0.978148 -0.207912 0.210688 0.977553 1 16.4663)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        y1="-0.75"
        x2="70"
        y2="-0.75"
        transform="matrix(0.978148 0.207912 -0.210688 0.977553 1 1.46631)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
