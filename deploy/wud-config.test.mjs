import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const deployDirectory = fileURLToPath(new URL('.', import.meta.url));
const compose = readFileSync(resolve(deployDirectory, 'docker-compose.vps.yml'), 'utf8');
const environmentExample = readFileSync(resolve(deployDirectory, 'env.vps.example'), 'utf8');

function serviceBlock(serviceName) {
  const match = compose.match(
    new RegExp(`^  ${serviceName}:\\r?\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9_-]*:|^volumes:)`, 'm'),
  );

  assert.ok(match, `Servico ${serviceName} nao encontrado no Compose`);
  return match[1];
}

function assertWatchLabel(serviceName, expected) {
  assert.match(
    serviceBlock(serviceName),
    new RegExp(`wud\\.watch: "${expected}"`),
    `${serviceName} deve definir wud.watch=${expected}`,
  );
}

test('WUD observa somente frontend e backend com selecao opt-in', () => {
  assert.match(
    serviceBlock('wud'),
    /WUD_WATCHER_LOCAL_WATCHBYDEFAULT: \$\{WUD_WATCHER_LOCAL_WATCHBYDEFAULT:-false\}/,
  );

  assertWatchLabel('frontend', 'true');
  assertWatchLabel('backend', 'true');
  assertWatchLabel('postgres', 'false');
  assertWatchLabel('wud', 'false');

  for (const serviceName of ['postgres', 'wud']) {
    assert.doesNotMatch(
      serviceBlock(serviceName),
      /wud\.trigger|wud\.watch\.digest/,
      `${serviceName} nao pode ter trigger ou configuracao de atualizacao`,
    );
  }
});

test('WUD inicia sem atualizacao automatica e PostgreSQL permanece fixado', () => {
  assert.match(
    serviceBlock('wud'),
    /WUD_TRIGGER_DOCKER_LOCAL_AUTO: \$\{WUD_AUTO_UPDATE:-false\}/,
  );
  assert.match(environmentExample, /^WUD_AUTO_UPDATE=false$/m);
  assert.match(serviceBlock('postgres'), /image: postgres:18\.4-alpine/);
});
