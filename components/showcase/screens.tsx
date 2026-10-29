import Image from "next/image";

import boowieLibrary from "@/data/screens/boowie-library.webp";
import boowiePlayer from "@/data/screens/boowie-player.webp";
import boowieReader from "@/data/screens/boowie-reader.webp";
import boowieStore from "@/data/screens/boowie-store.webp";
import omnibusBooking from "@/data/screens/omnibus-booking.webp";
import omnibusDesktop from "@/data/screens/omnibus-desktop.webp";
import omnibusFlowStart from "@/data/screens/omnibus-flow-start.webp";
import omnibusHomeMobile from "@/data/screens/omnibus-home-mobile.webp";
import omnibusMobile from "@/data/screens/omnibus-mobile.webp";
import omnibusResults from "@/data/screens/omnibus-results.webp";
import omnibusSeats from "@/data/screens/omnibus-seats.webp";
import wovieFilm from "@/data/screens/wovie-film.webp";
import wovieFilmHero from "@/data/screens/wovie-film-hero.webp";
import wovieHome from "@/data/screens/wovie-home.webp";
import wovieSignup from "@/data/screens/wovie-signup.webp";
import wovieTrailer from "@/data/screens/wovie-trailer.webp";
import type { ProjectCase } from "@/data/projects";
import { BrowserFrame, PhoneFrame, type Shot } from "./frames";
import { PhoneStory } from "./phone-story";
import { Reveal } from "./reveal";
import { ScrollingWindow } from "./scrolling-window";
import type { CycleFrame } from "./screen-cycle";
import { WindowStack } from "./window-stack";
import { type LoopVideo, WindowVideo } from "./window-video";
import { cn } from "@/lib/utils";

/**
 * Real screenshots of the products, in the devices they run on.
 *
 * Large screens get the composition a product page would use: the desktop app
 * in a browser window with the phone version leaning on it, or a row of
 * phones. Small screens get only the phone shots, side by side or as a row you
 * swipe — a desktop screenshot shrunk to a phone's width is unreadable.
 *
 * Alt text comes from `projects:screens.*`, so each language describes the
 * picture in its own words.
 */

type Translate = (key: string) => string;

const SHOTS = {
  omnibusDesktop: omnibusDesktop,
  omnibusMobile: omnibusMobile,
  omnibusFlowStart: omnibusFlowStart,
  omnibusResults: omnibusResults,
  omnibusBooking: omnibusBooking,
  omnibusSeats: omnibusSeats,
  omnibusHomeMobile: omnibusHomeMobile,
  boowieLibrary: boowieLibrary,
  boowieStore: boowieStore,
  boowiePlayer: boowiePlayer,
  boowieReader: boowieReader,
  wovieHome: wovieHome,
  wovieFilm: wovieFilm,
  wovieFilmHero: wovieFilmHero,
  wovieTrailer: wovieTrailer,
  wovieSignup: wovieSignup,
} as const;

type ShotId = keyof typeof SHOTS;

const shot = (id: ShotId, t: Translate): Shot => ({
  src: SHOTS[id],
  alt: t(`projects:screens.${id}`),
});

/**
 * Which screenshots each project has. A project missing here shows none.
 * `windows` are further desktop screens: the second window of a desktop-only
 * composition, and the row under the composition in a case study.
 */
const BY_PROJECT: Record<
  string,
  {
    desktop?: ShotId;
    phones: ShotId[];
    windows?: ShotId[];
    /** Shown under "How it is built" in place of the working demo. */
    built?: ShotId;
    /** A full-length screenshot of the desktop page. When present, the main
     *  window scrolls through it as the visitor scrolls past (add the file to
     *  SHOTS and name it here). */
    fullPage?: ShotId;
    /** A scroll story for the Work page: one screen per step, its copy under
     *  `projects:<id>.story.<key>`. */
    story?: { shot: ShotId; key: string }[];
    /** A silent screen recording laid over the main window's screenshot, in
     *  `public/screens/`. Its first frame should be that screenshot. */
    video?: LoopVideo;
  }
> = {
  omnibus: {
    // The still is the first frame of the recording: a whole booking, from
    // the search on the home page to the boarding pass.
    desktop: "omnibusFlowStart",
    phones: ["omnibusSeats", "omnibusHomeMobile", "omnibusMobile"],
    windows: ["omnibusResults", "omnibusBooking"],
    built: "omnibusSeats",
    video: { mp4: "/screens/omnibus-flow.mp4", webm: "/screens/omnibus-flow.webm" },
  },
  boowie: {
    phones: ["boowieLibrary", "boowieStore", "boowiePlayer"],
    built: "boowieReader",
    story: [
      { shot: "boowieLibrary", key: "library" },
      { shot: "boowieStore", key: "store" },
      { shot: "boowieReader", key: "reader" },
      { shot: "boowiePlayer", key: "player" },
    ],
  },
  wovie: {
    // A film page, because that is where the backdrop turns into the trailer.
    // The still is the recording's first frame, so the fade into the video
    // shows nothing until the trailer itself comes in.
    desktop: "wovieFilmHero",
    phones: [],
    windows: ["wovieHome", "wovieTrailer", "wovieSignup"],
    video: { mp4: "/screens/wovie-hero.mp4", webm: "/screens/wovie-hero.webm" },
  },
};

export function hasScreens(project: ProjectCase) {
  return project.slug in BY_PROJECT;
}

/** The big window of a composition: scrolling when there is a full-page
 *  shot, playing when there is a recording. */
function MainWindow({
  shot,
  full,
  host,
  video,
}: {
  shot: Shot;
  full?: Shot;
  host: string;
  video?: LoopVideo;
}) {
  if (full) return <ScrollingWindow src={full.src} alt={full.alt} host={host} />;
  return (
    <BrowserFrame
      shot={shot}
      host={host}
      overlay={video ? <WindowVideo video={video} /> : undefined}
    />
  );
}

/** Phones in a row on large screens, a swipeable strip on small ones. */
function PhoneRow({ shots }: { shots: Shot[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pt-2 pb-12 sm:-mx-6 sm:px-6 md:mx-0 md:justify-center md:gap-8 md:overflow-visible md:px-0">
      {shots.map((s, i) => (
        <Reveal
          key={s.alt}
          delay={i * 0.08}
          className="w-[62%] max-w-[260px] shrink-0 snap-center md:w-[30%]"
        >
          <PhoneFrame shot={s} />
        </Reveal>
      ))}
    </div>
  );
}

/** Browser windows you swipe through: desktop-only projects on a phone. */
function WindowRow({ shots, host }: { shots: Shot[]; host: string }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-2 pb-12 sm:-mx-6 sm:px-6">
      {shots.map((s) => (
        <BrowserFrame
          key={s.alt}
          shot={s}
          host={host}
          className="w-[86%] shrink-0 snap-center"
        />
      ))}
    </div>
  );
}

/**
 * One project's screenshots. With a desktop shot and a phone shot: the
 * browser window with the phone leaning on its corner (large screens), the
 * phone alone (small). With desktop shots only: a second window overlapping
 * the first (large), a row of windows to swipe (small).
 */
export function ProductShots({
  project,
  t,
  gallery = false,
  story = false,
}: {
  project: ProjectCase;
  t: Translate;
  /** Work page: tell the product as a scroll story on large screens when it
   *  has one. */
  story?: boolean;
  /** Case studies: on large screens, the windows that do not fit the
   *  composition follow it as a row. Small screens swipe through all of
   *  them anyway. */
  gallery?: boolean;
}) {
  const set = BY_PROJECT[project.slug];
  if (!set) return null;
  const phones = set.phones.map((id) => shot(id, t));

  if (!set.desktop && story && set.story) {
    const steps = set.story.map((s) => ({
      ...shot(s.shot, t),
      title: t(`projects:${project.id}.story.${s.key}.title`),
      body: t(`projects:${project.id}.story.${s.key}.body`),
    }));
    return (
      <>
        <div className="hidden md:block">
          <PhoneStory steps={steps} />
        </div>
        <div className="md:hidden">
          <PhoneRow shots={phones} />
        </div>
      </>
    );
  }

  if (!set.desktop) return <PhoneRow shots={phones} />;

  const desktop = shot(set.desktop, t);
  const fullPage = set.fullPage ? shot(set.fullPage, t) : undefined;

  if (phones.length === 0) {
    const windows = (set.windows ?? []).map((id) => shot(id, t));
    return (
      <>
        <div className="hidden md:block">
          <WindowStack
            main={desktop}
            full={fullPage}
            stack={windows}
            host={project.host}
            video={set.video}
          />
        </div>
        {gallery && windows.length > 1 && (
          <div className="mt-16 hidden items-start gap-8 md:grid md:grid-cols-2">
            {windows.slice(1).map((w) => (
              <BrowserFrame key={w.alt} shot={w} host={project.host} />
            ))}
          </div>
        )}
        <div className="md:hidden">
          <WindowRow shots={[desktop, ...windows]} host={project.host} />
        </div>
      </>
    );
  }

  // A case study shows its `built` screen further down, under "How it is
  // built", so here the window leans on another phone and the swipe row leaves
  // that screen out. The Work page has no such section and leads with it.
  const others = gallery && set.built
    ? set.phones.filter((id) => id !== set.built).map((id) => shot(id, t))
    : phones;
  const lead = others[0] ?? phones[0];
  const windows = gallery ? (set.windows ?? []).map((id) => shot(id, t)) : [];

  return (
    <>
      <div className="relative mx-auto hidden max-w-[980px] pb-[6%] text-left md:block">
        <Reveal className="w-[86%]">
          <MainWindow
            shot={desktop}
            full={fullPage}
            host={project.host}
            video={set.video}
          />
        </Reveal>
        <Reveal from="right" delay={0.15} className="absolute right-0 bottom-0 w-[23%]">
          <PhoneFrame shot={lead} />
        </Reveal>
      </div>
      {windows.length > 0 && (
        <div className="mt-16 hidden items-start gap-8 md:grid md:grid-cols-2">
          {windows.map((w, i) => (
            <Reveal key={w.alt} delay={i * 0.08}>
              <BrowserFrame shot={w} host={project.host} />
            </Reveal>
          ))}
        </div>
      )}
      <div className="md:hidden">
        {gallery && others.length > 1 ? (
          <PhoneRow shots={others} />
        ) : (
          <PhoneFrame shot={lead} className="mx-auto w-[64%] max-w-[260px]" />
        )}
      </div>
    </>
  );
}

/**
 * The opening picture of the Work page and the phone home: two products at
 * once. Large screens: Omnibus in a browser, Boowie's player on a phone
 * leaning on it. Small screens: the two phone shots side by side.
 */
export function HeroShots({
  t,
  omnibusHost,
}: {
  t: Translate;
  omnibusHost: string;
}) {
  const desktop = shot("omnibusDesktop", t);
  const player = shot("boowiePlayer", t);
  const mobile = shot("omnibusHomeMobile", t);

  return (
    <>
      <div className="relative mx-auto hidden max-w-[1040px] pb-[7%] text-left md:block">
        <Reveal className="w-[84%]">
          <BrowserFrame shot={desktop} host={omnibusHost} />
        </Reveal>
        <Reveal from="right" delay={0.15} className="absolute right-[2%] bottom-0 w-[22%]">
          <PhoneFrame shot={player} />
        </Reveal>
      </div>
      <div className="flex items-end justify-center gap-4 md:hidden">
        <PhoneFrame shot={mobile} className="w-[46%] max-w-[220px]" />
        <PhoneFrame shot={player} className="w-[46%] max-w-[220px]" />
      </div>
    </>
  );
}

/**
 * The header menu's project cards: each product's screens in turn.
 */
export const THUMBS: Record<string, CycleFrame[]> = {
  omnibus: [
    { src: omnibusDesktop, kind: "window" },
    { src: omnibusResults, kind: "window" },
    { src: omnibusBooking, kind: "window" },
    { src: omnibusSeats, kind: "phone" },
  ],
  boowie: [
    { src: boowieLibrary, kind: "phone" },
    { src: boowieStore, kind: "phone" },
    { src: boowieReader, kind: "phone" },
    { src: boowiePlayer, kind: "phone" },
  ],
  wovie: [
    { src: wovieHome, kind: "window" },
    { src: wovieFilm, kind: "window" },
    { src: wovieTrailer, kind: "window" },
    { src: wovieSignup, kind: "window" },
  ],
};

/**
 * The station card on the 3D home: the product's screenshots sized for a
 * panel that has to fit a 13" screen next to the planet. A browser window with
 * the phone leaning on it, or a row of phones at a fixed height.
 */
export function DockShots({
  project,
  t,
}: {
  project: ProjectCase;
  t: Translate;
}) {
  const set = BY_PROJECT[project.slug];
  if (!set) return null;
  const phones = set.phones.map((id) => shot(id, t));

  if (set.desktop) {
    const desktop = shot(set.desktop, t);
    const phone = phones[0];
    return (
      <div className={cn("relative", phone && "pb-[6%]")}>
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-white/15 bg-black",
            phone && "w-[84%]",
          )}
        >
          <div className="flex h-7 items-center gap-1.5 border-b border-white/12 bg-white/5 px-3" aria-hidden>
            <span className="size-2 rounded-full bg-white/22" />
            <span className="size-2 rounded-full bg-white/22" />
            <span className="size-2 rounded-full bg-white/22" />
            <span className="ml-2 truncate text-label text-zinc">{project.host}</span>
          </div>
          <Image
            src={desktop.src}
            alt={desktop.alt}
            sizes="460px"
            className="block h-auto w-full"
          />
        </div>
        {phone && (
          <div className="absolute right-0 bottom-0 w-[22%] overflow-hidden rounded-[16px] border-[3px] border-[#1c1c20] bg-black">
            <Image
              src={phone.src}
              alt={phone.alt}
              sizes="120px"
              className="block h-auto w-full"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-3">
      {phones.map((p) => (
        <div
          key={p.alt}
          className="overflow-hidden rounded-[18px] border-[3px] border-[#1c1c20] bg-black"
        >
          <Image
            src={p.src}
            alt={p.alt}
            sizes="130px"
            className="block h-[230px] w-auto deck-short:h-[170px]"
          />
        </div>
      ))}
    </div>
  );
}

export function hasBuiltShot(project: ProjectCase) {
  return Boolean(BY_PROJECT[project.slug]?.built);
}

/** The screen that shows the mechanism a case study's "How it is built" is
 *  about: Boowie's reader, where the same parsed book is read and listened;
 *  Omnibus's seat map, the thing two passengers race for. */
export function BuiltShot({
  project,
  t,
}: {
  project: ProjectCase;
  t: Translate;
}) {
  const id = BY_PROJECT[project.slug]?.built;
  if (!id) return null;
  return (
    <PhoneFrame shot={shot(id, t)} className="mx-auto w-[64%] max-w-[300px]" />
  );
}
