import test from 'node:test';
import assert from 'node:assert/strict';
import { privateErrorEvent } from '../lib/monitoring/privacy.ts';

test('monitoring preserves code locations while dropping player and request data at the outbound boundary', () => {
  const secret = 'PRIVATE_PLAYER_SAVE_COOKIE_INVITE';
  const event = {type: undefined, event_id: 'test', message: secret, logentry: {message: secret},
    request: {url: `https://example.test/?invite=${secret}`, cookies: {session: secret}},
    user: {id: secret}, extra: {save: secret}, tags: {player: secret},
    breadcrumbs: [{message: secret}], contexts: {game: {state: secret}},
    exception: {values: [{type: 'TypeError', value: secret, mechanism: {type: secret}, stacktrace: {frames: [{
      filename: `https://example.test/assets/Game-abc123.js?invite=${secret}#${secret}`,
      function: secret, vars: {save: secret}, context_line: secret, lineno: 42, colno: 7, in_app: true,
    }, {filename: `https://example.test/_next/static/chunks/page-xyz.js?${secret}`, lineno: 9, colno: 2}]}}]},
  };
  const before = structuredClone(event);
  const result = privateErrorEvent(event, 'roamcroft@1.12.0');
  assert.ok(result);
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(result.exception?.values?.[0].stacktrace?.frames?.[0].filename, 'Game-abc123.js');
  assert.equal(result.exception?.values?.[0].stacktrace?.frames?.[0].lineno, 42);
  assert.equal(result.exception?.values?.[0].stacktrace?.frames?.[1].filename, 'page-xyz.js');
  assert.equal(result.release, 'roamcroft@1.12.0');
  assert.deepEqual(event, before);
  assert.equal(privateErrorEvent({type: undefined, message: secret}, 'roamcroft@1.12.0'), null);
});
