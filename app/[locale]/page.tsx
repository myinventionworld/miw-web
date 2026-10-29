import { Experience } from "@/components/experience";
import { canDeliver } from "@/lib/delivery";

export default function Home() {
  // Read when the page is built: Vercel has the variables then, and changing
  // them needs a redeploy anyway.
  return <Experience direct={canDeliver()} />;
}
