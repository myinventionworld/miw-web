import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The two device frames every product screenshot sits in. No client code, so
 * both the server-rendered compositions and the animated ones can use them.
 */

export interface Shot {
  src: StaticImageData;
  alt: string;
}

export function BrowserFrame({
  shot,
  host,
  className,
  overlay,
}: {
  shot: Shot;
  host: string;
  className?: string;
  /** Laid over the screenshot, same size: the product's own motion. */
  overlay?: ReactNode;
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
      <div className="relative">
        <Image
          src={shot.src}
          alt={shot.alt}
          sizes="(min-width: 1024px) 880px, 90vw"
          className="block h-auto w-full"
        />
        {overlay}
      </div>
    </div>
  );
}

export function PhoneFrame({ shot, className }: { shot: Shot; className?: string }) {
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
