import type { ReactNode } from "react";

import { Cover, type CoverPerson } from "./cover";

/**
 * The opening of a light page, set out the way the brand cover itself is: the
 * words on the left, the live cover on the right half running from the header
 * to the first band below, so the body bleeds off the top and the moon rises
 * from the edge. The text column starts on the same rule as the page's
 * sections (the 64rem frame). On a phone the picture comes first, as a banner
 * under the header. Used by About and by the 404 page.
 */
export function CoverHero({
  people,
  picture,
  children,
}: {
  /** Also put these people on the cover's orbits. */
  people?: CoverPerson[];
  picture?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="md:grid md:grid-cols-[max(2rem,calc((100%_-_64rem)/2_+_2rem))_minmax(0,1fr)_46%]">
      <div className="aspect-[3/2] w-full border-b border-line md:col-start-3 md:row-start-1 md:self-stretch md:border-0">
        {picture ?? <Cover people={people} />}
      </div>
      <div className="px-4 pt-12 pb-20 sm:px-6 md:col-start-2 md:row-start-1 md:self-center md:px-0 md:py-16 md:pr-12">
        {children}
      </div>
    </section>
  );
}
