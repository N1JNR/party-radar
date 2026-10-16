import { defineConfig } from 'vitest/config';

// Configuração extra do Vitest usada pelo `ng test` (angular.json > test > runnerConfig).
// As metas de cobertura seguem o AGENTS.md e fazem a suíte falhar se não forem atingidas.
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // Quais arquivos entram no relatório fica no angular.json (coverageInclude/Exclude).
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
        'src/app/features/**/domain/**': {
          lines: 100,
          statements: 100,
          functions: 100,
          branches: 100,
        },
      },
    },
  },
});
