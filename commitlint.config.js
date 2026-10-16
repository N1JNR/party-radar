// Valida as mensagens de commit conforme o CONTRIBUTING.md (seção "Commits").
// Roda no hook commit-msg e na CI, nos commits de cada PR.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Os títulos dos PRs agrupados do Dependabot passam de 72 caracteres e não são nossos.
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
  rules: {
    // Tipo, escopo e descrição curta somados em até 72 caracteres.
    'header-max-length': [2, 'always', 72],
    // Corpo e rodapé quebrados em 72 (linhas com links são ignoradas pelo commitlint).
    'body-max-line-length': [2, 'always', 72],
    'footer-max-line-length': [2, 'always', 72],
    // Escopo sempre em minúsculas, sem prefixo: (login), e não (Login).
    'scope-case': [2, 'always', 'lower-case'],
  },
};
