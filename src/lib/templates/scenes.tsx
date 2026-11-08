"use client";

import type { VariableValues } from "@/lib/viewer/evaluate";

/**
 * Template scene registry: maps a template ID to its hand-built React
 * Three Fiber scene component. Templates consume the same slider values
 * interface as composed scenes (Task 5 builds the Seasons scene).
 */

export type TemplateSceneComponent = (props: { values: VariableValues }) => React.ReactElement;

const TEMPLATE_SCENES: Record<string, TemplateSceneComponent> = {};

export function getTemplateScene(templateId: string): TemplateSceneComponent | undefined {
  return TEMPLATE_SCENES[templateId];
}
