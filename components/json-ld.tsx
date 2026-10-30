import { serializeJsonLd } from "@/lib/structured-data";

/** A page's structured data. Rendered on the server, read by crawlers. */
export function JsonLd({ graph }: { graph: object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  );
}
