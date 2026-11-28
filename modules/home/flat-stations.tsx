"use client";

import { useRef, type CSSProperties } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LocaleLink } from "@/modules/i18n";
import {
  projectBySlug,
  projectForStation,
  Reveal,
  StationPhone,
  StationWindow,
  type ProjectCase,
} from "@/modules/work";
import { cn } from "@/shared/lib/cn";

import type { ProgramPoint, StationCopy } from "./stations";

const FRAME = "mx-auto max-w-3xl px-5 py-20 sm:px-8 md:max-w-5xl md:py-24";
const EYEBROW = "text-small font-semibold text-zinc";
const HEADLINE =
  "mt-3 text-[clamp(1.9rem,8vw,2.6rem)] leading-[1.06] font-bold tracking-[-0.04em] text-white md:max-w-3xl md:text-[clamp(2.4rem,4vw,3.2rem)]";
const LEDE = "mt-4 text-copy leading-relaxed text-zinc md:max-w-2xl";
const PILL =
  "flex w-full items-center justify-center rounded-full bg-action px-6 py-3.5 text-lead font-medium text-on-action transition-colors hover:bg-action-hover sm:w-auto";
const LINK = "text-lead font-medium text-comet hover:underline";

/** Starts the draw-in once the picture is on screen; with reduced motion it is simply there. */
function useDrawIn() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const play = (delay: number): CSSProperties => ({
    animationDelay: `${delay}s`,
    animationPlayState: seen || reduce ? "running" : "paused",
  });
  return { ref, play };
}

const MAP = { w: 390, h: 300, r: 320, orbit: 338 };
const MAP_CY = 170 + MAP.r;
const limb = (x: number, r: number) =>
  MAP_CY - Math.sqrt(r * r - (x - MAP.w / 2) ** 2);
const ORBIT_EDGE = Math.sqrt(MAP.orbit ** 2 - (MAP_CY - MAP.h) ** 2);

const MAP_PINS = [
  { to: "backend", x: 48, high: false },
  { to: "commerce", x: 145, high: true },
  { to: "labs", x: 245, high: true },
  { to: "transmission", x: 342, high: false },
] as const;

const MAP_PRODUCTS = [
  { id: "omnibus", x: 96, r: 5 },
  { id: "boowie", x: 195, r: 6.5 },
  { id: "wovie", x: 294, r: 4 },
];

/** The opening picture on a phone: the planet under the headline, a pin per part of the page. */
export function HeroMap({ className }: { className?: string }) {
  const { t } = useTranslation(["common", "stations"]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${MAP.w} ${MAP.h}`}
        aria-hidden
        className="block h-auto w-full"
      >
        <circle
          className="cover-moon"
          cx={MAP.w / 2}
          cy={MAP_CY}
          r={MAP.r}
          fill="var(--color-comet)"
          style={{ animationDelay: "0.1s" }}
        />
        <path
          d={`M${MAP.w / 2 - ORBIT_EDGE} ${MAP.h} A${MAP.orbit} ${MAP.orbit} 0 0 1 ${MAP.w / 2 + ORBIT_EDGE} ${MAP.h}`}
          pathLength={1}
          className="cover-orbit"
          style={{ animationDelay: "0.3s" }}
          fill="none"
          stroke="var(--color-white)"
          strokeWidth={1.2}
        />
        {MAP_PRODUCTS.map((p, i) => (
          <circle
            key={p.id}
            className={cn("cover-planet", `cover-${p.id}`)}
            cx={p.x}
            cy={limb(p.x, MAP.orbit)}
            r={p.r}
            style={{ animationDelay: `${1.2 + i * 0.15}s` }}
          />
        ))}
      </svg>
      {MAP_PINS.map(({ to, x, high }, i) => (
        <a
          key={to}
          href={`#${to}`}
          className="cover-planet group absolute flex w-[25%] -translate-x-1/2 -translate-y-[calc(100%-5px)] flex-col items-center text-center"
          style={{
            left: `${(x / MAP.w) * 100}%`,
            top: `${(limb(x, MAP.orbit) / MAP.h) * 100}%`,
            animationDelay: `${0.9 + i * 0.12}s`,
          }}
        >
          <span className="bg-void px-1 text-meta leading-tight font-semibold text-white group-hover:text-comet">
            {to === "transmission" ? t("nav.contact") : t(`stations:${to}.nav`)}
          </span>
          <span className="mt-0.5 bg-void px-1 text-label leading-tight text-balance text-zinc">
            {t(`home.pins.${to}`).replaceAll(" · ", "\u00a0· ")}
          </span>
          <span
            aria-hidden
            className={cn("mt-1.5 w-px bg-white/30", high ? "h-10" : "h-4")}
          />
          <span
            aria-hidden
            className="size-2.5 rounded-full border-[1.5px] border-white bg-void"
          />
        </a>
      ))}
    </div>
  );
}

function ProductLine({
  project,
  status,
}: {
  project: ProjectCase;
  status: string;
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2.5">
      <span
        aria-hidden
        className="size-2.5 shrink-0 self-center rounded-full"
        style={{ background: project.color }}
      />
      <span className="text-title font-bold tracking-[-0.02em] text-white">
        {project.name}
      </span>
      <span className="text-small text-zinc">{status}</span>
    </p>
  );
}

function ProductLinks({ project }: { project: ProjectCase }) {
  const { t } = useTranslation("common");

  return (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
      {project.liveUrl && (
        <a
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK}
        >
          {t("project.liveApp")}
          <span className="sr-only"> {project.name}</span>
        </a>
      )}
      <LocaleLink href={`/work/${project.slug}`} className={LINK}>
        {t("project.caseStudy")}
        <span className="sr-only">: {project.name}</span>
      </LocaleLink>
    </div>
  );
}

export function StartupsBand() {
  const { t } = useTranslation(["stations", "common", "projects"]);
  const project = projectForStation("backend");
  const copy = t("backend.business", { returnObjects: true }) as StationCopy;
  const facts = t("backend.case", { returnObjects: true }) as ProgramPoint[];

  return (
    <section id="backend" className="scroll-mt-14 overflow-x-clip bg-carbon">
      <div className={FRAME}>
        <p className={EYEBROW}>{t("backend.nav")}</p>
        <h2 className={HEADLINE}>{copy.headline}</h2>
        <p className={LEDE}>{copy.lede}</p>

        {project && (
          <>
            <div className="mt-10">
              <ProductLine
                project={project}
                status={t(`projects:environment.${project.environment}`)}
              />
            </div>
            <div className="relative mt-6 pb-[9%] md:pb-[6%]">
              <Reveal className="w-[88%] md:w-[84%]">
                <StationWindow project={project} t={t} />
              </Reveal>
              <Reveal
                from="right"
                delay={0.15}
                className="absolute right-0 bottom-0 w-[30%] md:w-[22%]"
              >
                <StationPhone project={project} t={t} />
              </Reveal>
            </div>

            <dl className="mt-10 grid gap-x-8 md:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="border-t border-line py-4">
                  <dt className="text-small font-semibold text-comet">
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 text-copy leading-snug text-white">
                    {f.body}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-meta text-steel">
              {project.stack.join(" · ")}
            </p>
          </>
        )}

        <div className="mt-10 flex flex-col items-center gap-x-7 gap-y-4 sm:flex-row">
          <a href="#transmission" className={PILL}>
            {t("backend.cta")}
          </a>
          {project && (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK}
                >
                  {t("common:project.openNamed", { name: project.name })}
                </a>
              )}
              <LocaleLink href={`/work/${project.slug}`} className={LINK}>
                {t("common:project.caseStudy")}
                <span className="sr-only">: {project.name}</span>
              </LocaleLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const RING = { w: 390, h: 196, cx: 195, cy: 92, tilt: (12 * Math.PI) / 180 };
const RINGS = [
  { rx: 176, ry: 36 },
  { rx: 146, ry: 29 },
];
const BODY_R = 56;

function ringPoint(rx: number, ry: number, t: number) {
  const x = rx * Math.cos(t);
  const y = ry * Math.sin(t);
  return {
    x: RING.cx + x * Math.cos(RING.tilt) - y * Math.sin(RING.tilt),
    y: RING.cy + x * Math.sin(RING.tilt) + y * Math.cos(RING.tilt),
  };
}

/** The point on the near half of the outer ring straight above `x`. */
function frontPointAt(x: number) {
  const { rx, ry } = RINGS[0];
  let lo = 0.05;
  let hi = Math.PI - 0.05;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ringPoint(rx, ry, mid).x > x) lo = mid;
    else hi = mid;
  }
  return ringPoint(rx, ry, (lo + hi) / 2);
}

function halfRing(rx: number, ry: number, near: boolean) {
  const a = ringPoint(rx, ry, 0);
  const b = ringPoint(rx, ry, Math.PI);
  const deg = (RING.tilt * 180) / Math.PI;
  return near
    ? `M${a.x} ${a.y} A${rx} ${ry} ${deg} 0 1 ${b.x} ${b.y}`
    : `M${b.x} ${b.y} A${rx} ${ry} ${deg} 0 1 ${a.x} ${a.y}`;
}

const SERVICE_PINS = [RING.w / 6, RING.w / 2, (RING.w * 5) / 6].map(
  frontPointAt,
);
const MOON = ringPoint(RINGS[1].rx, RINGS[1].ry, -2.2);

/** The ringed planet of the 3D station, drawn flat, with the three services hanging from its ring. */
function RingedPlanet({ points }: { points: ProgramPoint[] }) {
  const { ref, play } = useDrawIn();

  return (
    <div ref={ref}>
      <svg
        viewBox={`0 0 ${RING.w} ${RING.h}`}
        aria-hidden
        className="block h-auto w-full"
      >
        {RINGS.map((r, i) => (
          <path
            key={`far-${r.rx}`}
            d={halfRing(r.rx, r.ry, false)}
            pathLength={1}
            className="cover-orbit"
            style={play(0.1 + i * 0.2)}
            fill="none"
            stroke="var(--color-white)"
            strokeWidth={1.2}
          />
        ))}
        <circle
          cx={MOON.x}
          cy={MOON.y}
          r={9}
          fill="var(--color-comet)"
          className="cover-planet"
          style={play(1.1)}
        />
        <circle
          cx={RING.cx}
          cy={RING.cy}
          r={BODY_R}
          fill="var(--color-white)"
          className="cover-planet"
          style={play(0)}
        />
        {RINGS.map((r, i) => (
          <g key={`near-${r.rx}`}>
            <path
              d={halfRing(r.rx, r.ry, true)}
              pathLength={1}
              className="cover-orbit"
              style={play(0.5 + i * 0.2)}
              fill="none"
              stroke="var(--color-void)"
              strokeWidth={5}
            />
            <path
              d={halfRing(r.rx, r.ry, true)}
              pathLength={1}
              className="cover-orbit"
              style={play(0.5 + i * 0.2)}
              fill="none"
              stroke="var(--color-white)"
              strokeWidth={1.2}
            />
          </g>
        ))}
        {SERVICE_PINS.map((p, i) => (
          <g key={i} className="cover-planet" style={play(1.3 + i * 0.15)}>
            <line
              x1={p.x}
              y1={p.y + 4.5}
              x2={p.x}
              y2={RING.h}
              stroke="var(--color-white)"
              strokeOpacity={0.35}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={4.5}
              fill="var(--color-void)"
              stroke="var(--color-white)"
              strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
      <dl className="grid grid-cols-3 gap-x-3">
        {points.slice(0, SERVICE_PINS.length).map((p, i) => (
          <div
            key={p.label}
            className="cover-planet pt-2 text-center"
            style={play(1.4 + i * 0.15)}
          >
            <dt className="text-small leading-tight font-semibold text-white">
              {p.label}
            </dt>
            <dd className="mt-1 text-meta leading-snug text-zinc">{p.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CommerceBand() {
  const { t } = useTranslation(["stations", "projects"]);
  const client = projectForStation("commerce");
  const copy = t("commerce.business", { returnObjects: true }) as StationCopy;
  const steps = t("commerce.steps", { returnObjects: true }) as string[];
  const program = t("commerce.program", {
    returnObjects: true,
  }) as ProgramPoint[];

  return (
    <section id="commerce" className="scroll-mt-14 overflow-x-clip">
      <div
        className={cn(
          FRAME,
          "md:grid md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-14",
        )}
      >
        <div className="md:col-start-2">
          <p className={EYEBROW}>{t("commerce.nav")}</p>
          <h2 className={cn(HEADLINE, "md:text-[clamp(2rem,3.4vw,2.6rem)]")}>
            {copy.headline}
          </h2>
          <p className={LEDE}>{copy.lede}</p>
        </div>

        <div className="mt-12 md:col-start-1 md:row-span-2 md:row-start-1 md:mt-0 md:self-center">
          <RingedPlanet points={program} />
        </div>

        <div className="md:col-start-2">
          <ol className="mt-12 border-t border-line md:mt-8">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-5 border-b border-line py-3.5">
                <span className="text-small font-semibold text-comet tabular-nums">
                  {i + 1}
                </span>
                <span className="text-body leading-snug text-white">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center sm:justify-start">
            <a href="#transmission" className={PILL}>
              {t("commerce.cta")}
            </a>
          </div>
          {client && (
            <div className="mt-10 border-t border-line pt-5">
              <ProductLine
                project={client}
                status={t(`projects:environment.${client.environment}`)}
              />
              <p className="mt-2 text-copy leading-snug text-white">
                {t("commerce.example")}
              </p>
              <ProductLinks project={client} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProductsBand() {
  const { t } = useTranslation(["stations", "common", "projects"]);
  const copy = t("labs.business", { returnObjects: true }) as StationCopy;
  const boowie = projectBySlug("boowie");
  const wovie = projectBySlug("wovie");
  const status = (p: ProjectCase) => t(`projects:environment.${p.environment}`);

  return (
    <section id="labs" className="scroll-mt-14 overflow-x-clip bg-carbon">
      <div className={FRAME}>
        <p className={EYEBROW}>{t("labs.nav")}</p>
        <h2 className={HEADLINE}>{copy.headline}</h2>
        <p className={LEDE}>{copy.lede}</p>

        {boowie && wovie && (
          <div className="mt-12 grid gap-14 md:grid-cols-[38%_1fr] md:items-end md:gap-10">
            <div>
              <div className="flex gap-4">
                <Reveal className="w-1/2 max-w-[220px]">
                  <StationPhone
                    project={boowie}
                    t={t}
                    index={0}
                    className="rounded-[2.2rem] border-[6px]"
                  />
                </Reveal>
                <Reveal delay={0.1} className="w-1/2 max-w-[220px]">
                  <StationPhone
                    project={boowie}
                    t={t}
                    index={2}
                    className="rounded-[2.2rem] border-[6px]"
                  />
                </Reveal>
              </div>
              <div className="mt-6">
                <ProductLine project={boowie} status={status(boowie)} />
                <p className="mt-2 text-copy leading-snug text-white">
                  {t("labs.products.boowie")}
                </p>
                <ProductLinks project={boowie} />
              </div>
            </div>
            <div>
              <Reveal>
                <StationWindow project={wovie} t={t} />
              </Reveal>
              <div className="mt-6">
                <ProductLine project={wovie} status={status(wovie)} />
                <p className="mt-2 text-copy leading-snug text-white">
                  {t("labs.products.wovie")}
                </p>
                <ProductLinks project={wovie} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-line pt-5">
          <p className="text-small text-zinc">{t("labs.landNote")}</p>
          <LocaleLink href="/work" className={cn(LINK, "mt-1 inline-block")}>
            {t("labs.door")}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
