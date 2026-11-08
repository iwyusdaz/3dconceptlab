"use client";

import type { VariableValues } from "@/lib/viewer/evaluate";
import SeasonsScene from "./SeasonsScene";

/**
 * Template scene registry: maps a template ID to its hand-built React
 * Three Fiber scene component. Templates consume the same slider values
 * interface as composed scenes.
 */

export type TemplateSceneComponent = (props: { values: VariableValues }) => React.ReactElement;

const TEMPLATE_SCENES: Record<string, TemplateSceneComponent> = {
  seasons: SeasonsScene,
};

export function getTemplateScene(templateId: string): TemplateSceneComponent | undefined {
  return TEMPLATE_SCENES[templateId];
}

