// Liga e confere os agendamentos da Steam no Supabase na nuvem (spec 003 e 000-publicar-na-vercel).
//
// Grava de uma vez o endereço das funções e a JWT `service_role` no Vault e no segredo `SCHEDULE_KEY`:
// os dois lados saem da mesma leitura, então rodar de novo depois de girar a chave não os deixa diferentes.
// Em seguida, mostra as últimas respostas das funções, porque o cron marca "succeeded" mesmo com 401.
// A chave nunca é mostrada; os arquivos temporários ficam fora do projeto e são apagados na hora.
//
// Uso, na pasta do projeto, depois de `npx supabase login` e `link`:
//   npm run db:agendamentos:nuvem               grava e confere
//   npm run db:agendamentos:nuvem -- --conferir só confere

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const projectRef = readFileSync(new URL('../.temp/project-ref', import.meta.url), 'utf8').trim();
if (!/^[a-z0-9]+$/.test(projectRef)) {
  throw new Error('Projeto ligado inválido. Rode `npx supabase link` antes.');
}

// O shell só é preciso para achar o `npx` no Windows. Os argumentos não trazem segredo.
function supabase(args) {
  const result = spawnSync(`npx supabase ${args}`, {
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    // A saída fica de fora de propósito: pode conter a chave.
    throw new Error(`Falhou: supabase ${args.split(' ').slice(0, 2).join(' ')}`);
  }
  return result.stdout;
}

const parseJson = (output) => JSON.parse(output.slice(output.search(/[[{]/)));

function withTempFile(content, run) {
  const folder = mkdtempSync(join(tmpdir(), 'party-radar-'));
  const file = join(folder, 'segredo');
  writeFileSync(file, content, { mode: 0o600 });
  try {
    return run(`"${file}"`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
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

function record() {
  const keys = parseJson(
    supabase(`projects api-keys --project-ref ${projectRef} --reveal --output json`),
  );
  const serviceRole = keys.find((key) => key.name === 'service_role')?.api_key;
  if (!serviceRole?.startsWith('eyJ')) {
    throw new Error('Chave service_role (JWT) não encontrada. A `sb_secret_…` não serve aqui.');
  }
  withTempFile(`SCHEDULE_KEY=${serviceRole}\n`, (file) =>
    supabase(`secrets set --env-file ${file} --project-ref ${projectRef}`),
  );
  withTempFile(
    upsertSecret('project_url', `https://${projectRef}.supabase.co`) +
      upsertSecret('service_role_key', serviceRole),
    (file) => supabase(`db query --linked -f ${file}`),
  );
  console.log('Vault e SCHEDULE_KEY gravados com a mesma chave.');
}

function check() {
  const sql = `select coalesce(json_agg(x), '[]')::text as respostas from (
    select status_code, created::text as quando
    from net._http_response order by created desc limit 5
  ) x;`;
  const output = withTempFile(sql, (file) =>
    supabase(`db query --linked --output json -f ${file}`),
  );
  const answers = JSON.parse(parseJson(output).rows[0].respostas);
  if (answers.length === 0) {
    console.log('Nenhuma resposta ainda: o agendamento roda a cada 5 minutos.');
    return;
  }
  for (const answer of answers) {
    console.log(`${answer.quando}  ${answer.status_code}`);
  }
  if (answers[0].status_code !== 200) {
    console.error(
      `A última chamada respondeu ${answers[0].status_code}: os agendamentos não andam.`,
    );
    process.exitCode = 1;
  }
}

if (!process.argv.includes('--conferir')) {
  record();
}
check();
