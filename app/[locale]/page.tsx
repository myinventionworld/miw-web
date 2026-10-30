import { Experience } from "@/modules/home";
import { canDeliver } from "@/modules/enquiry/server";

export default function Home() {
  // Read when the page is built: Vercel has the variables then, and changing
  // them needs a redeploy anyway.
  return <Experience direct={canDeliver()} />;
}
