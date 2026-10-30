import { cn } from "@/shared/lib/cn";

const TONES = {
  primary: {
    key: "bg-comet/10 text-comet-soft hover:bg-comet/20 hover:text-white",
    code: "text-comet/60 group-hover:text-comet",
  },
  muted: {
    key: "text-zinc hover:bg-white/5 hover:text-white",
    code: "text-steel",
  },
};

export function ConsoleKey({
  code,
  tone = "muted",
  children,
  ...rest
}: React.ComponentProps<"button"> & {
  code: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex items-center justify-between px-4 py-3 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-comet",
        TONES[tone].key,
      )}
      {...rest}
    >
      <span>{children}</span>
      <span aria-hidden className={TONES[tone].code}>
        [{code}]
      </span>
    </button>
  );
}
