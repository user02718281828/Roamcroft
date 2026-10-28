import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryView, inventoryAction } from '../lib/ui/inventory.ts';
import { campGroups, nextPanel } from '../lib/ui/game-menu.ts';
import { Engine, createState } from '../lib/game/model.ts';
import { serialize, deserialize } from '../lib/game/save.ts';

test('pack views never mutate stock; over-capacity legacy quantities survive and invalid item imports remain rejected', () => {
  const engine = new Engine(createState());
  engine.s.inventory = {wood: 1200, apple: 2, wheatseed: 7, stone: 3, 'legacy-item': 19, fiber: 0};
  const before = JSON.parse(serialize(engine.s));
  const english = inventoryView(engine.s.inventory, 'all', 'quantity', 'en');
  assert.equal(english[0].id, 'wood'); assert.equal(english[0].count, 1200);
  assert.equal(english.find(item => item.id === 'legacy-item')?.count, 19);
  assert.equal(english.find(item => item.id === 'wood')?.name, 'Wood');
  assert.equal(inventoryView(engine.s.inventory, 'all', 'name', 'tr').find(item => item.id === 'wood')?.name, 'Odun');
  assert.deepEqual(inventoryView(engine.s.inventory, 'food', 'name', 'en').map(item => item.id), ['apple']);
  assert.deepEqual(inventoryView(engine.s.inventory, 'seeds', 'name', 'en').map(item => item.id), ['wheatseed']);
  assert.deepEqual(new Set(inventoryView(engine.s.inventory, 'resources', 'quantity', 'en').map(item => item.id)), new Set(['wood', 'stone']));
  const after = JSON.parse(serialize(engine.s));
  assert.deepEqual(after.payload, before.payload); assert.equal(after.checksum, before.checksum);
  assert.throws(() => deserialize(serialize(engine.s)), /Envanter/);
  const validLegacy = structuredClone(engine.s);
  delete validLegacy.inventory['legacy-item'];
  assert.equal(deserialize(serialize(validLegacy)).inventory.wood, 1200);
});

test('pack action previews keep tool levels and inventory intact; unknown saved items have no invented action', () => {
  const state = createState(), before = structuredClone(state);
  assert.deepEqual(inventoryAction('apple'), {kind: 'eat', id: 'apple'});
  assert.deepEqual(inventoryAction('wheatseed'), {kind: 'plant', crop: 'wheat'});
  assert.deepEqual(inventoryAction('applesapling'), {kind: 'build', type: 'appletree'});
  assert.deepEqual(inventoryAction('pearsapling'), {kind: 'build', type: 'peartree'});
  assert.deepEqual(inventoryAction('sprinkler'), {kind: 'build', type: 'sprinkler'});
  assert.deepEqual(inventoryAction('fertilizer'), {kind: 'fertilize'});
  assert.deepEqual(inventoryAction('wood'), {kind: 'none'});
  assert.deepEqual(inventoryAction('legacy-item'), {kind: 'none'});
  assert.deepEqual(state, before);
});

test('camp navigation exposes every core menu once and keeps online conditional on a server world', () => {
  const offline = campGroups(false).flatMap(group => group.panels), online = campGroups(true).flatMap(group => group.panels);
  assert.equal(offline.length, 9); assert.equal(new Set(offline).size, 9);
  assert.equal(offline.includes('online'), false); assert.equal(online.filter(id => id === 'online').length, 1);
  for (const panel of ['inventory','craft','build','ranch','quests','villagers','bundles','mine','settings']) assert.ok(offline.includes(panel as typeof offline[number]));
  assert.equal(nextPanel('settings', 1, false), 'inventory');
  assert.equal(nextPanel('inventory', -1, false), 'settings');
  assert.equal(nextPanel('mine', 1, true), 'online');
  assert.equal(nextPanel('online', 1, true), 'settings');
  assert.equal(nextPanel(null, 1, false), 'craft');
});

test('empty filtered packs stay empty and tied quantity sorting is stable across re-renders', () => {
  const bag = {wood: 2, stone: 2, wheatseed: 0};
  assert.deepEqual(inventoryView(bag, 'seeds', 'quantity', 'en'), []);
  assert.deepEqual(inventoryView(bag, 'food', 'name', 'tr'), []);
  assert.deepEqual(inventoryView(bag, 'all', 'quantity', 'en'), inventoryView({...bag}, 'all', 'quantity', 'en'));
});
