import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createExperienceRepository } from "@/lib/storage";
import { isValidShareId } from "@/lib/storage/types";
import { ExperienceViewer } from "@/components/viewer/ExperienceViewer";

export const metadata: Metadata = {
  title: "Shared experience — ConceptLab",
};

export const dynamic = "force-dynamic";

/**
 * Student share page: the experience is loaded entirely on the server —
 * the browser never sees Blob URLs or tokens, and no account is needed.
 */
export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  if (!isValidShareId(shareId)) notFound();

  const doc = await createExperienceRepository().get(shareId);
  if (!doc) notFound();

  return (
    <main className="share-page">
      <p className="share-context">Concept: {doc.concept}</p>
      <ExperienceViewer spec={doc.spec} ariaLabel="Shared 3D experience" />
    </main>
  );
}
