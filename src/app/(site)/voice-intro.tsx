"use client";

import { cn } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/content";
import { Pause, Volume2, VolumeX, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/*
 * The spoken welcome configured in Admin → Settings.
 *
 * Modern browsers block audible audio autoplay without a user gesture.
 * This component tries immediate playback upon entering the site, and if the
 * browser policy blocks it, seamlessly arms the very first click, touch or key press.
 */

const SESSION_KEY = "voice-intro-played";
const MUTED_KEY = "voice-intro-muted";

type Props = Pick<SiteSettingsData["voiceIntro"], "url" | "label" | "transcript" | "autoplay" | "oncePerSession">;

/** localStorage/sessionStorage throw in some privacy modes; never let that break the page. */
function readFlag(storage: "session" | "local", key: string) {
  try {
    return (storage === "session" ? sessionStorage : localStorage).getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(storage: "session" | "local", key: string, value: boolean) {
  try {
    const store = storage === "session" ? sessionStorage : localStorage;
    if (value) store.setItem(key, "1");
    else store.removeItem(key);
  } catch {
    // Storage unavailable — the greeting simply behaves as if it is a first visit.
  }
}

export default function VoiceIntro({ url, label, transcript, autoplay, oncePerSession }: Props) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [ready, setReady] = useState(false);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      if (audio.currentTime > 0) {
        try {
          audio.currentTime = 0;
        } catch {
          // ignore seek error on unbuffered audio
        }
      }
      await audio.play();
      setPlaying(true);
      if (oncePerSession) {
        writeFlag("session", SESSION_KEY, true);
      }
      return true;
    } catch {
      return false;
    }
  }, [oncePerSession]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setHasUserInteracted(true);
    if (playing) {
      stop();
    } else {
      if (muted) {
        setMuted(false);
        writeFlag("local", MUTED_KEY, false);
      }
      void play();
    }
  }, [playing, stop, muted, play]);

  useEffect(() => {
    /*
     * The stored preference is read after mount on purpose: reading it during
     * render would make the server and client markup disagree. `ready` then
     * releases the autoplay effect below, so it never runs before the
     * visitor's own setting is known.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: browser storage cannot be read while rendering
    setMuted(readFlag("local", MUTED_KEY));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || muted || !autoplay) return;
    if (oncePerSession && readFlag("session", SESSION_KEY)) return;
    // Autoplay welcome primarily on the homepage or landing visit
    if (!isHomePage && !readFlag("session", SESSION_KEY)) return;

    let cancelled = false;
    let started = false;

    const tryStart = async () => {
      if (started || cancelled) return;
      const success = await play();
      if (success) {
        started = true;
      }
      return success;
    };

    void tryStart().then((ok) => {
      if (ok || cancelled) return;

      const events = ["click", "pointerdown", "touchstart", "keydown"] as const;
      const onGesture = () => {
        events.forEach((ev) => window.removeEventListener(ev, onGesture));
        if (!cancelled && !started) {
          void tryStart();
        }
      };

      events.forEach((ev) => window.addEventListener(ev, onGesture, { once: true, passive: true }));
    });

    return () => {
      cancelled = true;
    };
  }, [ready, muted, autoplay, oncePerSession, play, isHomePage]);

  if (!ready || dismissed) return null;

  const buttonLabel = label || "Play my welcome";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden sm:inset-x-auto sm:left-5 sm:bottom-5 sm:justify-start">
      <div className={cn(
        "pointer-events-auto flex max-w-[22rem] items-center gap-1.5 rounded-full border border-border bg-card/95 p-1.5 pl-2 shadow-xl backdrop-blur-md transition-all",
        !playing && !hasUserInteracted && "animate-bounce ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
      )}>
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={playing ? "Stop the welcome message" : buttonLabel}
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary transition-transform",
              playing ? "animate-pulse scale-105" : "hover:scale-110"
            )}
            aria-hidden="true"
          >
            {playing ? <Pause className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </span>
          <span className="truncate">{playing ? "Playing welcome…" : buttonLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stop();
            const next = !muted;
            setMuted(next);
            writeFlag("local", MUTED_KEY, next);
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={muted ? "Allow the welcome message to play automatically" : "Do not play the welcome message automatically"}
          aria-pressed={muted}
          title={muted ? "Autoplay off" : "Autoplay on"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            stop();
            setDismissed(true);
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Hide the welcome player"
        >
          <X className="size-4" />
        </button>

        <audio
          ref={audioRef}
          src={url}
          preload={autoplay ? "auto" : "none"}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {transcript && <p className="sr-only">{transcript}</p>}
      </div>
    </div>
  );
}
