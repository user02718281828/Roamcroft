import { sourceText } from '../i18n/source.ts';
import type { State } from './model.ts';
import { MILESTONES } from './settlement.ts';

const chapters = [
  {title:sourceText("m_4cacd9b190"),text:sourceText("m_254de637e2"),voices:{narin:sourceText("m_6653afb35b"),torin:sourceText("m_135c939019"),lale:sourceText("m_17c5e33c79")}},
  {title:sourceText("m_3602aebf3c"),text:sourceText("m_d071a5d5a7"),voices:{narin:sourceText("m_4f32afd67f"),torin:sourceText("m_2a39e24976"),lale:sourceText("m_149a417a22")}},
  {title:sourceText("m_bdcb7ae2d9"),text:sourceText("m_4900127174"),voices:{narin:sourceText("m_394de626c2"),torin:sourceText("m_8de207b3a2"),lale:sourceText("m_bce14d2757")}},
  {title:sourceText("m_a89be642e3"),text:sourceText("m_fe23569b68"),voices:{narin:sourceText("m_b7a49f71ba"),torin:sourceText("m_ed47790dad"),lale:sourceText("m_64b50aaf40")}},
  {title:sourceText("m_2a175a4965"),text:sourceText("m_a06d8c07cd"),voices:{narin:sourceText("m_39ded082a8"),torin:sourceText("m_f030788a07"),lale:sourceText("m_55d01d0aa5")}},
  {title:sourceText("m_b0eb9378dd"),text:sourceText("m_bc6c39ff17"),voices:{narin:sourceText("m_741bc8d1da"),torin:sourceText("m_54176e2ce7"),lale:sourceText("m_65479b33ac")}},
];
// Story follows already saved milestones: no extra rewards, grind or save migration.
export function settlementStory(s: Pick<State,'settlement'>) {
  let stage=0;
  while(stage<MILESTONES.length&&s.settlement.milestones.includes(MILESTONES[stage].id))stage++;
  return {stage,chapter:chapters[stage],memories:chapters.slice(0,stage)};
}
