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
          Some concepts depend on spatial or moving relationships — why seasons happen, why
          the Moon has phases. Words and static diagrams struggle with those. ConceptLab
          turns them into 3D scenes students can scrub, tilt and explore.
        </p>
        <div className="hero-actions">
          <Link href="/demo" className="button primary">
            Try the demo
          </Link>
          <Link href="/create" className="button">
            Create an experience
          </Link>
        </div>
        <div className="demo-placeholder" role="img" aria-label="Demo video placeholder">
          [ Demo video / GIF coming here ]
        </div>
        <p className="hero-note">
          Standards-aligned with NGSS MS-ESS1-1: develop and use a model of the
          Earth–Sun–Moon system to describe cyclic patterns of lunar phases, eclipses and
          seasons.
        </p>
      </section>
      <section className="hero-scene" aria-label="Decorative 3D preview of a lit sphere">
        <HomeScene />
      </section>
    </main>
  );
}
