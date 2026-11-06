// Reader-first deployment switch. Keep readers and storage accounting when
// disabling native expansion, so reverting activation preserves saved data.
export const NATIVE_EXPANSION_ENABLED:boolean = true;
