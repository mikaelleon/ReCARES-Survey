/**
 * The landing page is one locked screen with sections along a fence (FenceStage).
 * The navbar, hero link and stage talk through two window events, so none of them
 * needs to know about the others.
 */
export type StageSection = 'survey' | 'about' | 'faq' | 'contact';

/** Ask the stage to move to a section. detail: StageSection */
export const STAGE_GO = 'stage:go';
/** The stage reports the section it is now showing. detail: StageSection */
export const STAGE_SECTION = 'stage:section';

/** Move one stop. detail: 1 (next) or -1 (previous). Used by the phone navbar's arrows. */
export const STAGE_STEP = 'stage:step';
/** Where the stage is, for controls that live outside it. detail: StageState */
export const STAGE_STATE = 'stage:state';

export interface StageState {
  index: number;
  count: number;
  label: string;
  section: StageSection;
}

declare global {
  interface Window {
    __stageSection?: StageSection;
    __stageState?: StageState;
  }
}

export function stageStep(direction: 1 | -1): void {
  window.dispatchEvent(new CustomEvent<number>(STAGE_STEP, { detail: direction }));
}

export function stageGo(section: StageSection): void {
  window.dispatchEvent(new CustomEvent<StageSection>(STAGE_GO, { detail: section }));
}

export function isStageSection(value: string | null | undefined): value is StageSection {
  return value === 'survey' || value === 'about' || value === 'faq' || value === 'contact';
}
