import Image, { type StaticImageData } from "next/image";

import boowieLibrary from "@/data/screens/boowie-library.webp";
import boowiePlayer from "@/data/screens/boowie-player.webp";
import boowieStore from "@/data/screens/boowie-store.webp";
import omnibusDesktop from "@/data/screens/omnibus-desktop.webp";
import omnibusMobile from "@/data/screens/omnibus-mobile.webp";
import type { ProjectCase } from "@/data/projects";
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

interface Shot {
  src: StaticImageData;
  alt: string;
}

const SHOTS = {
  omnibusDesktop: omnibusDesktop,
  omnibusMobile: omnibusMobile,
  boowieLibrary: boowieLibrary,
  boowieStore: boowieStore,
  boowiePlayer: boowiePlayer,
} as const;

type ShotId = keyof typeof SHOTS;

const shot = (id: ShotId, t: Translate): Shot => ({
  src: SHOTS[id],
  alt: t(`projects:screens.${id}`),
});

/** Which screenshots each project has. A project missing here shows none. */
const BY_PROJECT: Record<string, { desktop?: ShotId; phones: ShotId[] }> = {
  omnibus: { desktop: "omnibusDesktop", phones: ["omnibusMobile"] },
  boowie: { phones: ["boowieLibrary", "boowieStore", "boowiePlayer"] },
};

export function hasScreens(project: ProjectCase) {
  return project.slug in BY_PROJECT;
}

function BrowserFrame({
  shot,
  host,
  className,
}: {
  shot: Shot;
  host: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "device-shadow overflow-hidden rounded-[14px] border border-line bg-void",
        className,
      )}
    >
      <div className="flex h-9 items-center gap-2 border-b border-line px-4" aria-hidden>
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="ml-3 truncate text-meta text-zinc">{host}</span>
      </div>
      <Image
        src={shot.src}
        alt={shot.alt}
        sizes="(min-width: 1024px) 880px, 90vw"
        className="block h-auto w-full"
      />
    </div>
  );
}

function PhoneFrame({ shot, className }: { shot: Shot; className?: string }) {
  return (
    <div
      className={cn(
        "device-shadow overflow-hidden rounded-[2.6rem] border-[7px] border-[#111214] bg-[#111214]",
        className,
      )}
    >
      <Image
        src={shot.src}
        alt={shot.alt}
        sizes="(min-width: 768px) 260px, 60vw"
        className="block h-auto w-full rounded-[2.1rem]"
      />
    </div>
  );
}

/** Phones in a row on large screens, a swipeable strip on small ones. */
function PhoneRow({ shots }: { shots: Shot[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pt-2 pb-12 sm:-mx-6 sm:px-6 md:mx-0 md:justify-center md:gap-8 md:overflow-visible md:px-0">
      {shots.map((s) => (
        <PhoneFrame
          key={s.alt}
          shot={s}
          className="w-[62%] max-w-[260px] shrink-0 snap-center md:w-[30%]"
        />
      ))}
    </div>
  );
}

/**
 * One project's screenshots. With a desktop shot: the browser window with the
 * phone leaning on its corner (large screens), the phone alone (small).
 */
export function ProductShots({
  project,
  t,
}: {
  project: ProjectCase;
  t: Translate;
}) {
  const set = BY_PROJECT[project.slug];
  if (!set) return null;
  const phones = set.phones.map((id) => shot(id, t));

  if (!set.desktop) return <PhoneRow shots={phones} />;

  const desktop = shot(set.desktop, t);
  return (
    <>
      <div className="relative mx-auto hidden max-w-[980px] pb-[6%] text-left md:block">
        <BrowserFrame shot={desktop} host={project.host} className="w-[86%]" />
        <PhoneFrame
          shot={phones[0]}
          className="absolute right-0 bottom-0 w-[23%]"
        />
      </div>
      <div className="md:hidden">
        <PhoneFrame shot={phones[0]} className="mx-auto w-[64%] max-w-[260px]" />
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
  const mobile = shot("omnibusMobile", t);

  return (
    <>
      <div className="relative mx-auto hidden max-w-[1040px] pb-[7%] text-left md:block">
        <BrowserFrame shot={desktop} host={omnibusHost} className="w-[84%]" />
        <PhoneFrame shot={player} className="absolute right-[2%] bottom-0 w-[22%]" />
      </div>
      <div className="flex items-end justify-center gap-4 md:hidden">
        <PhoneFrame shot={mobile} className="w-[46%] max-w-[220px]" />
        <PhoneFrame shot={player} className="w-[46%] max-w-[220px]" />
      </div>
    </>
  );
}
