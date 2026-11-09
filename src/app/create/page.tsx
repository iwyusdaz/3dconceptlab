import type { Metadata } from "next";
import { CreateClient } from "./CreateClient";

export const metadata: Metadata = {
  title: "Create an experience — 3D ConceptLab",
};

export default function CreatePage() {
  return <CreateClient />;
}
