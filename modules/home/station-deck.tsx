"use client";

import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import { TEAM, initials } from "@/modules/team";
import {
  projectBySlug,
  projectForStation,
  StationPhone,
  StationWindow,
  type ProjectCase,
} from "@/modules/work";
import { cn } from "@/shared/lib/cn";
import type { StationId } from "@/shared/station-id";

import { STATIONS, type ProgramPoint, type StationCopy } from "./stations";
import { useBodyScreen } from "./use-body-screen";

/**
 * Scroll band each station's copy is on screen across: tight around the
 * anchor, so it only shows while the camera is parked and the dock magnet can
 * reach every position where it is half there.
 */
const BANDS: Record<StationId, [number, number]> = {
  backend: [0.035, 0.11],
  commerce: [0.25, 0.35],
  labs: [0.49, 0.59],
  team: [0.73, 0.83],
};

const FRAME = "mx-auto h-full max-w-[1500px] px-6 pb-8 lg:px-12";
const TOP = "pt-[calc(88px+min(9vh,88px))]";
const EYEBROW = "text-lift text-small font-semibold text-comet";
const HEADLINE =
  "text-lift text-[clamp(2.2rem,3.9vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.045em] text-white";
const LEDE = "text-lift text-copy-lg leading-relaxed text-zinc";
const PILL =
  "pointer-events-auto inline-flex rounded-full bg-action px-6 py-3 text-lead font-medium text-on-action transition-colors hover:bg-action-hover";
const LINK =
  "pointer-events-auto text-lead font-medium text-comet transition-colors hover:text-white";

type Translate = (key: string, options?: Record<string, unknown>) => string;

function Live({ project, t }: { project: ProjectCase; t: Translate }) {
  return (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK}
    >
      {t("common:project.openNamed", { name: project.name })}
    </a>
  );
}

function CaseStudy({ project, t }: { project: ProjectCase; t: Translate }) {
  return (
    <LocaleLink href={`/work/${project.slug}`} className={LINK}>
      {t("common:project.caseStudy")}
    </LocaleLink>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function Startups({ onAction }: { onAction: () => void }) {
  const { t } = useTranslation(["stations", "common", "projects"]);
  const project = projectForStation("backend");
  const copy = t("backend.business", { returnObjects: true }) as StationCopy;
  const facts = t("backend.case", { returnObjects: true }) as ProgramPoint[];

  return (
    <div
      className={cn(
        FRAME,
        TOP,
        "grid items-start gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-20",
      )}
    >
      <div className="max-w-md lg:max-w-none">
        <p className={EYEBROW}>{t("backend.nav")}</p>
        <h2 className={cn(HEADLINE, "mt-3")}>{copy.headline}</h2>
        <p className={cn(LEDE, "mt-5")}>{copy.lede}</p>
        <button type="button" onClick={onAction} className={cn(PILL, "mt-8")}>
          {t("backend.cta")}
        </button>
        {project && (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {project.liveUrl && <Live project={project} t={t} />}
            <CaseStudy project={project} t={t} />
          </div>
        )}
      </div>

      {project && (
        <div className="hidden pt-4 lg:block">
          <p className="text-lift flex items-center gap-2.5 text-body font-semibold text-white">
            <Dot color={project.color} />
            {project.name} · {t(`projects:environment.${project.environment}`)}
          </p>
          <div className="relative mt-4 w-[min(100%,calc((100vh-470px)*1.98))] pb-[7%]">
            <StationWindow project={project} t={t} className="w-[84%]" />
            <StationPhone
              project={project}
              t={t}
              className="absolute right-[6%] bottom-0 w-[18%]"
            />
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-6">
            {facts.map((f) => (
              <div key={f.label} className="border-t border-white/15 pt-3">
                <dt className="text-small font-semibold text-comet">
                  {f.label}
                </dt>
                <dd className="text-lift mt-1.5 text-copy leading-snug text-white">
                  {f.body}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-small text-steel">
            {project.stack.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Where each service is pinned on the ringed planet, in planet radii from its centre. */
const RING_PINS = [
  { x: -1.55, y: 1.32 },
  { x: -0.04, y: 1.58 },
  { x: 1.47, y: 1.32 },
];

function RingPins({ points }: { points: ProgramPoint[] }) {
  const layer = useRef<HTMLDivElement>(null);

  useBodyScreen("commerce", layer, (s, el) => {
    for (const [i, pin] of RING_PINS.entries()) {
      const node = el.children[i] as HTMLElement | undefined;
      if (!node) continue;
      node.style.transform = `translate(${(s.x + pin.x * s.r).toFixed(1)}px, ${(s.y + pin.y * s.r).toFixed(1)}px)`;
    }
  });

  return (
    <div
      ref={layer}
      aria-hidden
      className="absolute inset-0 hidden lg:block"
      style={{ visibility: "hidden" }}
    >
      {points.slice(0, RING_PINS.length).map((p) => (
        <div
          key={p.label}
          className="absolute top-0 left-0 flex w-48 -translate-x-1/2 -translate-y-[7px] flex-col items-center text-center"
        >
          <span className="size-3.5 rounded-full border-2 border-white bg-void" />
          <span className="h-6 w-px bg-white/40" />
          <span className="text-lift mt-1 text-body font-semibold text-white">
            {p.label}
          </span>
          <span className="text-lift mt-1 text-small leading-snug text-zinc">
            {p.body}
          </span>
        </div>
      ))}
    </div>
  );
}

function Commerce({ onAction }: { onAction: () => void }) {
  const { t } = useTranslation(["stations", "common", "projects"]);
  const client = projectForStation("commerce");
  const copy = t("commerce.business", { returnObjects: true }) as StationCopy;
  const steps = t("commerce.steps", { returnObjects: true }) as string[];
  const program = t("commerce.program", {
    returnObjects: true,
  }) as ProgramPoint[];

  return (
    <>
      <RingPins points={program} />
      <div
        className={cn(
          FRAME,
          TOP,
          "grid items-start lg:grid-cols-[1fr_minmax(0,27rem)]",
        )}
      >
        <div className="ml-auto max-w-sm lg:col-start-2 lg:ml-0 lg:max-w-none">
          <p className={EYEBROW}>{t("commerce.nav")}</p>
          <h2 className="text-lift mt-3 text-[clamp(2rem,3.35vw,3.1rem)] leading-[1.04] font-bold tracking-[-0.045em] text-white">
            {copy.headline}
          </h2>
          <p className={cn(LEDE, "mt-5 text-copy")}>{copy.lede}</p>
          <ol className="mt-7 border-t border-white/12">
            {steps.map((step, i) => (
              <li
                key={step}
                className="flex gap-5 border-b border-white/12 py-3"
              >
                <span className="text-small font-semibold text-comet tabular-nums">
                  {i + 1}
                </span>
                <span className="text-lift text-body leading-snug text-white">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={onAction} className={cn(PILL, "mt-7")}>
            {t("commerce.cta")}
          </button>
          {client && (
            <div className="mt-7 border-t border-white/12 pt-4">
              <p className="text-lift flex items-center gap-2.5 text-body">
                <Dot color={client.color} />
                <span className="font-semibold text-white">{client.name}</span>
                <span className="text-small text-zinc">
                  {t(`projects:environment.${client.environment}`)}
                </span>
              </p>
              <p className="text-lift mt-1 text-small leading-snug text-zinc">
                {t("commerce.example")}
              </p>
              <LocaleLink
                href={`/work/${client.slug}`}
                className={cn(LINK, "mt-2 inline-block text-body")}
              >
                {t("common:project.caseStudy")}
              </LocaleLink>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProductNote({ project }: { project: ProjectCase }) {
  const { t } = useTranslation(["stations", "common", "projects"]);

  return (
    <div>
      <p className="text-lift flex items-center gap-2.5">
        <Dot color={project.color} />
        <span className="text-heading font-bold tracking-[-0.02em] text-white">
          {project.name}
        </span>
        <span className="text-small text-zinc">
          {t(`projects:environment.${project.environment}`)}
        </span>
      </p>
      <p className="text-lift mt-2 text-copy leading-snug text-white">
        {t(`labs.products.${project.slug}`)}
      </p>
      <div className="mt-3 flex gap-6">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            {t("common:project.liveApp")}
          </a>
        )}
        <CaseStudy project={project} t={t} />
      </div>
    </div>
  );
}

function Products() {
  const { t } = useTranslation(["stations", "projects"]);
  const copy = t("labs.business", { returnObjects: true }) as StationCopy;
  const boowie = projectBySlug("boowie");
  const wovie = projectBySlug("wovie");
  const door = (
    <div className="lg:text-right">
      <p className="text-lift text-small text-zinc">{t("labs.landNote")}</p>
      <LocaleLink
        href="/work"
        className={cn(LINK, "mt-1 inline-block text-copy-lg")}
      >
        {t("labs.land")}
      </LocaleLink>
    </div>
  );

  return (
    <div
      className={cn(
        FRAME,
        "flex flex-col items-center pt-[calc(88px+min(5vh,48px))]",
      )}
    >
      <p className={EYEBROW}>{t("labs.nav")}</p>
      <h2 className="text-lift mt-3 text-center text-[clamp(2.1rem,4vw,3.6rem)] leading-[1.02] font-bold tracking-[-0.045em] text-white">
        {copy.headline}
      </h2>

      {boowie && wovie && (
        <div className="relative mt-[min(7vh,64px)] w-full max-w-2xl lg:w-[min(100%,940px,calc((100vh-440px)*2.6))] lg:max-w-none">
          <div className="hidden items-center gap-[4%] lg:flex">
            <div className="flex w-[36%] shrink-0 gap-[5%]">
              <StationPhone
                project={boowie}
                t={t}
                index={0}
                className="w-[47.5%]"
              />
              <StationPhone
                project={boowie}
                t={t}
                index={2}
                className="w-[47.5%]"
              />
            </div>
            <StationWindow project={wovie} t={t} className="min-w-0 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-8 lg:mt-[min(6vh,56px)] lg:grid-cols-[36%_1fr] lg:gap-[4%]">
            <ProductNote project={boowie} />
            <ProductNote project={wovie} />
          </div>
          <div className="mt-8 lg:absolute lg:right-[calc((100%-100vw)/2+3rem)] lg:bottom-[5.5rem] lg:mt-0">
            {door}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamRing({ copy }: { copy: RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation("about");
  const layer = useRef<HTMLDivElement>(null);

  useBodyScreen("team", layer, (s, el) => {
    const margin = window.innerWidth >= 1280 ? 110 : 70;
    const left = (copy.current?.getBoundingClientRect().right ?? 0) + margin;
    const rx = Math.max(
      160,
      Math.min(s.r * 3.4, s.x - left, window.innerWidth - s.x - margin),
    );
    const ry = Math.min(rx * 0.62, (window.innerHeight - 88) / 2 - 70);
    const ring = el.firstElementChild as HTMLElement | null;
    if (ring) {
      ring.style.transform = `translate(${(s.x - rx).toFixed(1)}px, ${(s.y - ry).toFixed(1)}px)`;
      ring.style.width = `${(rx * 2).toFixed(1)}px`;
      ring.style.height = `${(ry * 2).toFixed(1)}px`;
    }
    for (const [i] of TEAM.entries()) {
      const node = el.children[i + 1] as HTMLElement | undefined;
      if (!node) continue;
      const a = -Math.PI / 2 + (i / TEAM.length) * Math.PI * 2;
      const x = s.x + Math.cos(a) * rx;
      const y = s.y + Math.sin(a) * ry;
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  });

  return (
    <div
      ref={layer}
      className="absolute inset-0 hidden lg:block"
      style={{ visibility: "hidden" }}
    >
      <div className="absolute top-0 left-0 rounded-[50%] border border-white/15" />
      {TEAM.map((p, i) => (
        <div
          key={p.id}
          className={cn(
            "absolute top-0 left-0 flex w-36 -translate-x-1/2 flex-col items-center text-center xl:w-44",
            i === 0
              ? "-translate-y-[calc(100%-22px)] xl:-translate-y-[calc(100%-28px)]"
              : "-translate-y-[22px] xl:-translate-y-[28px]",
          )}
        >
          {i === 0 && (
            <PersonLabel name={p.name} role={t(`team.roles.${p.id}`)} above />
          )}
          <span className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-space-800 text-small font-semibold text-comet ring-1 ring-white/20 xl:size-14">
            {p.photo ? (
              <Image
                src={p.photo}
                alt=""
                width={112}
                height={112}
                sizes="56px"
                className="size-full object-cover"
              />
            ) : (
              initials(p.name)
            )}
          </span>
          {i !== 0 && (
            <PersonLabel name={p.name} role={t(`team.roles.${p.id}`)} />
          )}
        </div>
      ))}
    </div>
  );
}

function PersonLabel({
  name,
  role,
  above = false,
}: {
  name: string;
  role: string;
  above?: boolean;
}) {
  return (
    <span className={cn("flex flex-col items-center", above ? "mb-2" : "mt-2")}>
      <span className="text-lift text-small font-semibold whitespace-nowrap text-white">
        {name}
      </span>
      <span className="text-lift mt-0.5 hidden text-meta leading-snug text-zinc xl:block">
        {role}
      </span>
    </span>
  );
}

function Team() {
  const { t } = useTranslation("stations");
  const copy = useRef<HTMLDivElement>(null);

  return (
    <>
      <TeamRing copy={copy} />
      <div className={cn(FRAME, TOP)}>
        <div ref={copy} className="max-w-[20rem] xl:max-w-[24rem]">
          <p className={EYEBROW}>{t("team.nav")}</p>
          <h2 className={cn(HEADLINE, "mt-3")}>{t("team.headline")}</h2>
          <p className={cn(LEDE, "mt-5")}>{t("team.lede")}</p>
          <LocaleLink href="/about" className={cn(LINK, "mt-7 inline-block")}>
            {t("team.link")}
          </LocaleLink>
        </div>
      </div>
    </>
  );
}

function View({
  id,
  onAction,
}: {
  id: StationId;
  onAction: () => void;
}): ReactNode {
  if (id === "backend") return <Startups onAction={onAction} />;
  if (id === "commerce") return <Commerce onAction={onAction} />;
  if (id === "labs") return <Products />;
  return <Team />;
}

export function StationDeck({
  progress,
  onAction,
}: {
  progress: MotionValue<number>;
  onAction: () => void;
}) {
  const [active, setActive] = useState<StationId | null>(null);

  const resolve = useCallback((p: number) => {
    const next =
      STATIONS.find((s) => p >= BANDS[s.id][0] && p <= BANDS[s.id][1])?.id ??
      null;
    setActive(next);
  }, []);

  useEffect(() => resolve(progress.get()), [progress, resolve]);
  useMotionValueEvent(progress, "change", resolve);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <View id={active} onAction={onAction} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
