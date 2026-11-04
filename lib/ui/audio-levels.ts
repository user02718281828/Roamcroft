export type AudioLevels={music:number;ambience:number;effects:number};
export const DEFAULT_AUDIO:AudioLevels={music:.45,ambience:.7,effects:.65};
export function cleanLevels(value:Partial<AudioLevels>):AudioLevels {
 return Object.fromEntries(Object.entries(DEFAULT_AUDIO).map(([key,fallback])=>{const n=value[key as keyof AudioLevels];return [key,typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback];})) as AudioLevels;
}
export function readAudioLevels():AudioLevels{try{return cleanLevels(JSON.parse(localStorage.getItem('roamcroft.audio.v1')||'{}'));}catch{return {...DEFAULT_AUDIO};}}
export function storeAudioLevels(levels:AudioLevels){try{localStorage.setItem('roamcroft.audio.v1',JSON.stringify(cleanLevels(levels)));}catch{}}
