import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The type scale in `globals.css` (`--text-label` … `--text-heading-xl`) has to
 * be registered here. Unregistered, tailwind-merge reads `text-label` as a text
 * colour, and `cn("text-label", "text-white")` silently drops the size.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "label",
        "meta",
        "small",
        "body",
        "lead",
        "copy",
        "copy-lg",
        "title",
        "heading",
        "heading-lg",
        "heading-xl",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
