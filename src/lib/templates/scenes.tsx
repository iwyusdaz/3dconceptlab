"use client";

import type { VariableValues } from "@/lib/viewer/evaluate";
import SeasonsScene, { SeasonsGroundViewCanvas } from "./SeasonsScene";
import EclipsesScene from "./EclipsesScene";

/**
 * Template scene registry: maps a template ID to its hand-built React
 * Three Fiber scene component plus an optional inset panel (rendered as a
 * small always-visible picture-in-picture canvas, so it can never overlap
 * the main scene). Templates consume the same slider values interface as
 * composed scenes.
 */

export type TemplateSceneComponent = (props: {
  values: VariableValues;
  labelsVisible?: boolean;
}) => React.ReactElement | null;

export interface TemplateSceneEntry {
  scene: TemplateSceneComponent;
  /** Optional small inset canvas (e.g. the city ground view). */
  inset?: (props: { values: VariableValues }) => React.ReactElement | null;
}

const TEMPLATE_SCENES: Record<string, TemplateSceneEntry> = {
  seasons: { scene: SeasonsScene, inset: SeasonsGroundViewCanvas },
  eclipses: { scene: EclipsesScene },
};

export function getTemplateScene(templateId: string): TemplateSceneEntry | undefined {
  return TEMPLATE_SCENES[templateId];
}

