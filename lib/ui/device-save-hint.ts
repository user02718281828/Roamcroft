export type DeviceSaveHint = 'present' | 'empty' | 'unknown';
/** Presence only, never validation or loading. No game engine in the launcher bundle. */
export async function deviceSaveHint(storage:Pick<Storage,'getItem'>|undefined,factory:IDBFactory|undefined):Promise<DeviceSaveHint>{
  let uncertain=!storage;
  try{if(storage?.getItem('ocak-vadisi.save.v1'))return 'present';}catch{uncertain=true;}
  if(!factory)return 'unknown';
  return new Promise(resolve=>{
    let done=false;
    const finish=(result:DeviceSaveHint)=>{if(!done){done=true;resolve(result);}};
    try{
      const request=factory.open('ocak-vadisi-worlds');
      // A missing DB is not created just to show a start-screen label.
      request.onupgradeneeded=()=>{request.transaction?.abort();finish(uncertain?'unknown':'empty');};
      request.onerror=()=>finish(uncertain?'unknown':done?'empty':'unknown');
      request.onblocked=()=>finish('unknown');
      request.onsuccess=()=>{
        const db=request.result;
        if(done){db.close();return;}
        if(!db.objectStoreNames.contains('saves')){db.close();finish('unknown');return;}
        const tx=db.transaction('saves','readonly'),store=tx.objectStore('saves');
        // Check keys, not saved objects: no world cloning or record mutation.
        const keys=['current','backup','snapshot-a','snapshot-b'];let remaining=keys.length,present=false;
        for(const key of keys){const probe=store.getKey(key);probe.onsuccess=()=>{present ||= probe.result!==undefined;if(!--remaining)finish(present?'present':uncertain?'unknown':'empty');};}
        tx.onerror=()=>{db.close();finish('unknown');};tx.onabort=()=>{db.close();finish('unknown');};
        tx.oncomplete=()=>db.close();
      };
    }catch{finish('unknown');}
  });
}
