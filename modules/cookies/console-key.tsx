import { cn } from "@/shared/lib/cn";

const TONES = {
  primary: {
    key: "bg-comet/20 text-white hover:bg-comet/30",
    code: "text-comet-soft",
  },
  muted: {
    key: "text-platinum hover:bg-white/8 hover:text-white",
    code: "text-zinc",
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
