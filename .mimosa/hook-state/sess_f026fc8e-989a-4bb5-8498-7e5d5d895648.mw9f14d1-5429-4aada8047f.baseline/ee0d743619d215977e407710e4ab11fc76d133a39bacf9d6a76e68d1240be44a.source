import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFixture } from "@/fixtures";
import { ExperienceViewer } from "@/components/viewer/ExperienceViewer";

export const metadata: Metadata = {
  title: "Fixture preview",
};

/** Development preview of a bundled fixture experience, by key. */
export default async function FixturePreviewPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const fixture = getFixture(key);
  if (!fixture) notFound();
  return (
    <main>
      <ExperienceViewer spec={fixture.spec} ariaLabel={`Fixture preview: ${key}`} />
    </main>
  );
}
