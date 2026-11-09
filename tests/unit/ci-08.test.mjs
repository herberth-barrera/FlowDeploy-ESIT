import test from 'node:test';
import assert from 'node:assert/strict';

test('CI-08: una prueba fallida bloquea el CI', () => {
  assert.equal(1, 2);
});
