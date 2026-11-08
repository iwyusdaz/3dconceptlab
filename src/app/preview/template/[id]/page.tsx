import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/templates/registry";
import { FIXTURES } from "@/fixtures";
import { ExperienceViewer } from "@/components/viewer/ExperienceViewer";

export const metadata: Metadata = {
  title: "Template preview",
};

/** Development preview of a hand-built template, by ID (e.g. "seasons"). */
export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = getTemplate(id);
  const fixture = FIXTURES[id];
  if (!template || !fixture || fixture.spec.mode !== "template") notFound();
  return (
    <main>
      <ExperienceViewer spec={fixture.spec} ariaLabel={`Template preview: ${id}`} />
    </main>
  );
}
