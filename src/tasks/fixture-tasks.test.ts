import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFixtureTasks } from './fixture-tasks.ts';
test('crawl retrieval scopes are seeded paths, not extraction instructions', () => {
  const tasks = generateFixtureTasks({ seed: 'scope-test', baseUrl: 'https://fixture.invalid' });
  for (const task of tasks) if (task.input.track === 'crawl') {
    assert.ok(task.input.scope.startsWith('/r/scope-test/'));
    assert.ok(!task.input.scope.includes(' '));
    if (task.family === 'category-inventory') assert.equal(task.input.scope, '/r/scope-test/store');
  }
});
