import type { ProjectCase } from "@/data/projects";
import { Prototype } from "./prototypes";

/**
 * A product shown the way a product company shows one: inside the device it
 * runs on, on a white page, with one soft neutral shadow for depth. The screen
 * is the project's own working demo, kept dark like the app it stands in for.
 *
 * Projects without a demo get no frame at all. An empty browser window with a
 * "screenshot goes here" label is worse than no picture.
 */
function BrowserDevice({ project }: { project: ProjectCase }) {
  return (
    <div className="device-shadow mx-auto w-full max-w-[560px] overflow-hidden rounded-[14px] border border-line bg-void text-left">
      <div className="flex h-10 items-center gap-2 border-b border-line px-4" aria-hidden>
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="size-2.5 rounded-full bg-space-800" />
        <span className="ml-3 truncate text-meta text-zinc">{project.host}</span>
      </div>
      <div className="theme-dark bg-[#08080b] p-3">
        {project.variant && <Prototype variant={project.variant} />}
      </div>
    </div>
  );
}

function PhoneDevice({ project }: { project: ProjectCase }) {
  return (
    <div className="device-shadow mx-auto flex aspect-[9/19] w-[300px] max-w-full flex-col justify-center overflow-hidden rounded-[44px] border-[10px] border-[#111214] bg-[#08080b] text-left">
      <div className="theme-dark bg-[#08080b] px-2">
        {project.variant && <Prototype variant={project.variant} />}
      </div>
    </div>
  );
}

export function Device({ project }: { project: ProjectCase }) {
  if (project.variant === "reader") return <PhoneDevice project={project} />;
  if (project.variant === "booking") return <BrowserDevice project={project} />;
  return null;
}
