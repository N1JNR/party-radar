// Grava no Vault do Supabase local o endereço das Edge Functions e a secret key, que os
// agendamentos da Steam usam (spec 003, Parte 3b, T18). Só para o ambiente local: na nuvem, os
// dois entram uma vez pelo painel do Supabase. A chave nunca é mostrada nem gravada em arquivo.
//
// Uso: npm run db:agendamentos (com o Supabase local rodando).

import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Dentro da rede do Docker, o banco alcança o gateway das funções pelo nome `kong`.
const LOCAL_FUNCTIONS_URL = 'http://kong:8000';

function projectId() {
  const config = readFileSync(new URL('../config.toml', import.meta.url), 'utf8');
  const match = /^project_id\s*=\s*"([^"]+)"/m.exec(config);
  if (!match) {
    throw new Error('project_id não encontrado em supabase/config.toml');
  }
  return match[1];
}

function serviceRoleKey() {
  // Comando fixo, sem entrada de fora: o shell só é preciso para achar o `npx` no Windows.
  const status = execSync('npx supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const match = /^SERVICE_ROLE_KEY="?([^"\r\n]+)"?/m.exec(status);
  if (!match) {
    throw new Error('Supabase local parado? `supabase status` não trouxe a SERVICE_ROLE_KEY.');
  }
  return match[1];
}

const literal = (value) => `'${value.replaceAll("'", "''")}'`;

function upsertSecret(name, value) {
  return `
    do $$
    declare
      secret_id uuid;
    begin
      select id into secret_id from vault.secrets where name = ${literal(name)};
      if secret_id is null then
        perform vault.create_secret(${literal(value)}, ${literal(name)});
      else
        perform vault.update_secret(secret_id, ${literal(value)});
      end if;
    end;
    $$;`;
}

const sql = [
  upsertSecret('project_url', LOCAL_FUNCTIONS_URL),
  upsertSecret('service_role_key', serviceRoleKey()),
].join('\n');

execFileSync(
  'docker',
  [
    'exec',
    '-i',
    `supabase_db_${projectId()}`,
    'psql',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
    '-q',
  ],
  { input: sql, stdio: ['pipe', 'ignore', 'inherit'] },
);

console.log(
  `Vault local pronto: project_url = ${LOCAL_FUNCTIONS_URL} e service_role_key gravados.`,
);
