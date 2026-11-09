import type { Metadata } from "next";

import { DevValidateClient } from "./DevValidateClient";

export const metadata: Metadata = {
  title: "Spec validator (dev)",
};

// Development only. In production builds this route renders an explanation
// instead of the tool (see DevValidateClient), and the page is additionally
// excluded from production via `next.config.ts` page extension below.
export default function DevValidatePage() {
  return <DevValidateClient />;
}
