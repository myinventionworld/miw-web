import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { projectBySlug } from "@/data/projects";
import { initTranslations } from "@/i18n";
import { siteUrl } from "@/lib/site";

export const contentType = "image/png";
const size = { width: 1200, height: 630 };

export async function generateImageMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const project = projectBySlug(params.slug);
  if (!project) return [];
  const { t } = await initTranslations(params.locale, ["projects"]);
  return [
    {
      id: project.slug,
      size,
      contentType,
      alt: `${project.name} — ${t(`${project.id}.headline`)}`,
    },
  ];
}

/**
 * Onest from `@fontsource/onest`, the static package: the image renderer reads
 * WOFF but not the WOFF2 the pages use, and its default face has no Cyrillic.
 */
const SUBSETS = ["latin", "latin-ext", "cyrillic"] as const;

const font = (subset: string, weight: number) =>
  readFile(
    join(
      process.cwd(),
      `node_modules/@fontsource/onest/files/onest-${subset}-${weight}-normal.woff`,
    ),
  );

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const project = projectBySlug(slug)!;
  const { t } = await initTranslations(locale, ["projects"]);

  // One family per script: under a single name the renderer takes the first
  // bold face it finds (Latin) and draws Cyrillic from the regular one.
  const fonts = await Promise.all(
    SUBSETS.flatMap((subset) =>
      ([400, 700] as const).map(async (weight) => ({
        name: `Onest ${subset}`,
        data: await font(subset, weight),
        weight,
        style: "normal" as const,
      })),
    ),
  );

  const ring = (d: number, top: number, left: number) => (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: d,
        height: d,
        borderRadius: d,
        border: "1.5px solid #141517",
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#ffffff",
          fontFamily: SUBSETS.map((s) => `Onest ${s}`).join(", "),
          color: "#141517",
          overflow: "hidden",
        }}
      >
        {ring(900, -330, 760)}
        {ring(700, -230, 860)}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: 960,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: "#141517",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 878,
            width: 44,
            height: 44,
            borderRadius: 44,
            background: project.color,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            width: 860,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 26,
                background: project.color,
              }}
            />
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>
              {project.name}
            </div>
          </div>

          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -3,
            }}
          >
            {t(`${project.id}.headline`)}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 26,
              color: "#5c5f66",
            }}
          >
            <span>{t(`${project.id}.category`)}</span>
            <span>MIW Labs · {new URL(siteUrl()).host}</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
