import Image from "next/image";
import { LocaleLink } from "@/modules/i18n";
import { cn } from "@/shared/lib/cn";
import { TEAM, initials } from "./team";

const FACES = [...TEAM].sort((a, b) => Number(!a.photo) - Number(!b.photo));

export function TeamLine({
  line,
  link,
  className,
}: {
  line: string;
  link: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}>
      <ul aria-hidden className="flex pl-1.5">
        {FACES.map((p) => (
          <li
            key={p.id}
            className="-ml-1.5 flex size-7 items-center justify-center overflow-hidden rounded-full bg-space-800 text-label font-semibold text-zinc ring-2 ring-void"
          >
            {p.photo ? (
              <Image src={p.photo} alt="" width={56} height={56} className="size-full object-cover" />
            ) : (
              <span data-initials={initials(p.name)} className="before:content-[attr(data-initials)]" />
            )}
          </li>
        ))}
      </ul>
      <p className="text-small text-platinum">
        {line}{" "}
        <LocaleLink href="/about" className="font-medium text-comet hover:underline">
          {link}
        </LocaleLink>
      </p>
    </div>
  );
}
