/** UI-only gesture state. No inventory, damage, time or network authority. */
export class TouchPress {
  pointer: number | null = null;
  begin(id: number) { if (this.pointer !== null) return false; this.pointer = id; return true; }
  end(id: number, inside: boolean) {
    if (id !== this.pointer) return false;
    this.pointer = null;
    return inside;
  }
  cancel() { this.pointer = null; }
}

export const TOUCH_KEY = 'roamcroft.touch.v1';
export type TouchPreferences = { hand: 'right' | 'left'; size: 'regular' | 'large'; sensitivity: number };
export const DEFAULT_TOUCH: TouchPreferences = {hand: 'right', size: 'regular', sensitivity: 1};
export function touchPreferences(value: unknown): TouchPreferences {
  const v = value && typeof value === 'object' ? value as Partial<TouchPreferences> : {};
  return {hand: v.hand === 'left' ? 'left' : 'right', size: v.size === 'large' ? 'large' : 'regular',
    sensitivity: typeof v.sensitivity === 'number' && Number.isFinite(v.sensitivity) ? Math.max(.8, Math.min(1.2, v.sensitivity)) : 1};
}
export function readTouch(storage?: Pick<Storage, 'getItem'>): TouchPreferences {
  try { return touchPreferences(JSON.parse(storage?.getItem(TOUCH_KEY) || 'null')); } catch { return {...DEFAULT_TOUCH}; }
}
