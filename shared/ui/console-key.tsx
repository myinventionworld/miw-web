import { cn } from "@/shared/lib/cn";

const TONES = {
  primary: {
    key: "bg-white/10 text-white hover:bg-white/20",
    code: "text-white/50 group-hover:text-white/80",
  },
  muted: {
    key: "text-white/60 hover:bg-white/5 hover:text-white",
    code: "text-white/35",
  },
};

type ConsoleKeyProps<T extends React.ElementType> = {
  as?: T;
  code: string;
  tone?: keyof typeof TONES;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "code">;

export function ConsoleKey<T extends React.ElementType = "button">({
  as,
  code,
  tone = "muted",
  children,
  className,
  ...rest
}: ConsoleKeyProps<T>) {
  const Tag: React.ElementType = as ?? "button";

  return (
    <Tag
      {...(Tag === "button" && { type: "button" })}
      className={cn(
        "group flex grow basis-36 items-center justify-between gap-3 border-t border-l border-white/15 px-4 py-3 whitespace-nowrap normal-case transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-comet",
        TONES[tone].key,
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      <span aria-hidden className={TONES[tone].code}>
        [{code}]
      </span>
    </Tag>
  );
}

const CORNER = "pointer-events-none absolute z-10 size-2.5 border-white/60";

export function Corners() {
  return (
    <>
      <span className={`${CORNER} top-0 left-0 border-t border-l`} />
      <span className={`${CORNER} top-0 right-0 border-t border-r`} />
      <span className={`${CORNER} bottom-0 left-0 border-b border-l`} />
      <span className={`${CORNER} right-0 bottom-0 border-r border-b`} />
    </>
  );
}

export function ConsoleKeys({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-fit max-w-full overflow-hidden border border-white/15 bg-black/80 font-mono tracking-wider uppercase backdrop-blur",
        className,
      )}
    >
      <Corners />
      <div className="-mt-px -ml-px flex flex-wrap">{children}</div>
    </div>
  );
}
