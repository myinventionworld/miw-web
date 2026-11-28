import { cn } from "@/shared/lib/cn";
import { HEADER } from "./header-frame";
import { LocaleSwitch } from "./locale-switch";

export interface StatusText {
  prefix: string;
  status: string;
  scope: string;
}

export function StatusStrip({ text, className }: { text: StatusText; className?: string }) {
  return (
    <div className={cn(HEADER.strip, className)}>
      <p className="flex min-w-0 items-center gap-2">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-comet" />
        <span className="truncate font-medium text-white">
          {text.prefix}: {text.status}
        </span>
        <span className="hidden shrink-0 text-steel sm:inline">
          {"// "}
          {text.scope}
        </span>
      </p>
      <LocaleSwitch className="shrink-0" />
    </div>
  );
}
