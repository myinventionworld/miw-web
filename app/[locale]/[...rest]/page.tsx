import { notFound } from "next/navigation";

/**
 * Any address under a language that no page claims. The proxy has already put
 * a locale in front of it, so this hands it to `[locale]/not-found.tsx`, which
 * answers 404 in the reader's language inside the site's own layout.
 */
export default function Unknown() {
  notFound();
}
