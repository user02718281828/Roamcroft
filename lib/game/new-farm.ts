import { createState, type State } from './model.ts';
import { sourceText } from '../i18n/source.ts';

export type StartProfile = 'standard' | 'lean';

/** Only an explicitly confirmed new device farm uses this factory. Never a load migration. */
export function createNewFarm(seed: number, profile: StartProfile = 'standard'): State {
  if (profile !== 'standard' && profile !== 'lean') throw Error('Unknown start profile');
  const state = createState(seed);
  if (profile === 'lean') {
    state.gold = 60;
    state.inventory = {wood:8, stone:6, fiber:4, wheatseed:6, carrotseed:4, berry:4, bread:2};
  }
  return state;
}

/** Do not hand a replacement to the running game until persistence acknowledges it. */
export async function prepareNewFarm(seed: number, profile: StartProfile,
  persist: (state: State) => Promise<boolean>): Promise<State> {
  const state = createNewFarm(seed, profile);
  if (!await persist(state)) throw Error(sourceText('start.saveFailed'));
  return state;
}
