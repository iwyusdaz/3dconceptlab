import Link from "next/link";
import { HomeScene } from "@/components/viewer/HomeScene";

export default function Home() {
  return (
    <main className="landing">
      <section className="hero">
        <h1>ConceptLab</h1>
        <p className="tagline">
          Type a concept. Get an interactive 3D learning experience your students can explore.
        </p>
        <p className="tagline-sub">
          Built for concepts that words and static diagrams can&apos;t show — like why seasons
          happen or why the Moon has phases.
        </p>
        <div className="hero-actions">
          <Link href="/demo" className="button primary">
            Try the demo
          </Link>
          <Link href="/create" className="button">
            Create an experience
          </Link>
        </div>
        <p className="hero-note">
          Standards-aligned with NGSS MS-ESS1-1: lunar phases, eclipses and seasons.
        </p>
      </section>
      <section className="hero-scene" aria-label="Decorative 3D preview of a lit sphere">
        <HomeScene />
      </section>
    </main>
  );
}
