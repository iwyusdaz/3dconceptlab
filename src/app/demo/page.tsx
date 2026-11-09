import type { Metadata } from "next";
import Link from "next/link";
import { FIXTURES } from "@/fixtures";
import { ExperienceViewer } from "@/components/viewer/ExperienceViewer";

export const metadata: Metadata = {
  title: "Demo experiences — 3D ConceptLab",
  description:
    "Explore three example 3D experiences — why Earth has seasons, why the Moon has phases, and solar and lunar eclipses — with no setup and no AI cost.",
};

/**
 * /demo: pre-made example experiences bundled with the app. No AI calls and
 * no storage reads or writes in any mode.
 */
export default function DemoPage() {
  const keys = Object.keys(FIXTURES);
  return (
    <main className="demo">
      <h1>Demo experiences</h1>
      <p>
        Complete examples bundled with 3D ConceptLab. Nothing is generated, nothing is
        stored — just explore.
      </p>
      {keys.map((key) => {
        const fixture = FIXTURES[key];
        return (
          <section key={key} className="demo-experience" id={`demo-${key}`} aria-labelledby={`demo-${key}-title`}>
            <h2 id={`demo-${key}-title`}>{fixture.spec.content.title}</h2>
            <ExperienceViewer spec={fixture.spec} ariaLabel={`Demo experience: ${key}`} />
          </section>
        );
      })}
      <p className="demo-footer">
        Want your own concept? <Link href="/create">Create an experience</Link> (owner
        access code required) or <Link href="/">learn more</Link>.
      </p>
    </main>
  );
}
