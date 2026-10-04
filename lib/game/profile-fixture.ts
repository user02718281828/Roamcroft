import { createState, tileAt } from './model.ts';

// Called only by the localhost profiling entry point. Keep fixtures valid saves.
export function profileFixture(dense = false) {
  const state = createState(84621);
  state.day = 4;
  state.won = true;
  if (dense)
    for (let i = 0; i < 24; i++) {
      const home = {
        id: state.nextId++,
        type: 'coop',
        x: 9 + (i % 8),
        z: 24 + Math.floor(i / 8),
        level: 3,
        hp: 200,
        timer: 0,
        enabled: true,
      };
      const tile = tileAt(state, home.x, home.z)!;
      tile.terrain = 'grass';
      tile.resource = null;
      tile.crop = null;
      tile.growth = 0;
      tile.tilled = false;
      tile.water = 0;
      state.buildings.push(home);
      for (let j = 0; j < 3; j++)
        state.animals.push({
          id: state.nextId++,
          type: 'chicken',
          home: home.id,
          x: home.x + 0.2 * j,
          z: home.z + 1,
          timer: 0,
          fed: true,
        });
    }
  return state;
}
