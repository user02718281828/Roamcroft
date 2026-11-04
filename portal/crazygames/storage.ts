import type {State} from '../../lib/game/model';
import type {CrazyGamesDataStore} from '../../lib/platform/crazygames-data';
let store:CrazyGamesDataStore|null=null,initial:State|null=null;
export function configureData(value:CrazyGamesDataStore,state:State){store=value;initial=state;}
export function loadLocal(){if(!initial)throw Error('Data Module is not ready');return {state:initial,message:''};}
export async function loadStored(){return loadLocal();}
// Unload checkpoints must never write into a potentially changed SDK account.
export function saveLocal(_state:State){return false;}
export async function saveStored(state:State){return store?store.save(state):false;}
export {serialize,deserialize,SAVE_KEY,BACKUP_KEY} from '../../lib/game/save';
