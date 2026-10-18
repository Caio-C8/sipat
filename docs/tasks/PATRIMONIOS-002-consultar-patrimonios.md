# `PATRIMONIOS-002` — Consultar e listar patrimônios

**Status:** aprovada

## Objetivo

Implementar consulta detalhada e listagem paginada de patrimônios para os dois
perfis, com busca, filtros, relações atuais e payload limitado.

## Contexto e referências

- Roadmap: [PATRIMONIOS-002](../roadmap.md#patrimonios-002--consultar-e-listar-patrimônios).
- Dependências: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md) e
  [PATRIMONIOS-001](./PATRIMONIOS-001-cadastrar-patrimonios.md) concluídos e
  verificados.
- Requisitos: [RF11 e UC11](../requisitos-SIPAT.md#rf11-consulta-listagem-e-filtros-de-patrimônios),
  RNF02, RNF03, RNF04, RNF05, RN08 e RN16.
- API: [repositories](../apps/api/repositories.md),
  [mappers](../apps/api/types-and-mappers.md),
  [performance](../apps/api/performance.md),
  [segurança de saída](../apps/api/security/input-and-output.md) e
  [workflow](../apps/api/workflow-and-testing.md).
- Banco: [queries e índices](../performance/database.md#queries-e-payload).

## Ordem de execução

1. Confirmar worktree, contratos e schema realmente implementados.
2. Mapear filtros, ordenação, seleção e relações exigidas pelas responses.
3. Implementar repository com `select` mínimo e sem N+1.
4. Implementar service, mappers, DTOs e as duas rotas.
5. Avaliar índices com massa representativa e plano de execução.
6. Cobrir unidade, integração e E2E de paginação, filtros e acesso.
7. Executar as verificações e atualizar status somente após as evidências.

## Escopo

- `GET /api/patrimonios` para `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`;
- página padrão 1, tamanho padrão 20 e máximo 50;
- busca normalizada pelos campos definidos em `textoBusca`;
- filtros por status, setor, espécie, natureza e tipo de numeração;
- ordenação determinística documentada e protegida por teste, com desempate por
  identificador estável;
- `GET /api/patrimonios/:patrimonioId` para os mesmos perfis;
- setor atual com responsável atual e espécie com natureza, obtidos pelas
  relações vigentes;
- processo de compra e dados contábeis/de depreciação somente conforme a
  response detalhada aprovada;
- mapper como allowlist e validação runtime da response;
- índices somente quando sustentados pelas queries e pelo plano observado.

## Fora do escopo

- listagem sem limite, busca em históricos ou relatório;
- cache, exportação, cursor ou full-text extension sem evidência de necessidade;
- formatação visual com zeros no backend;
- mutations, impressão, Web e mobile.

## Decisões aprovadas

- Administrador pode consultar, mas não cadastrar nem substituir número.
- Uma lista vazia é sucesso e mantém metadados coerentes.
- Filtro inválido falha no boundary; não é ignorado.
- Responsável vem do setor atual e natureza vem da espécie; não serão copiados
  para o patrimônio como fontes paralelas.
- A API retorna o número canônico e o tipo; padding é responsabilidade do
  consumidor futuro.

## Critérios de aceite

- [ ] anônimo recebe `401` e os dois perfis autenticados consultam;
- [ ] listagem respeita padrões, máximo, filtros e ordenação determinística;
- [ ] busca usa os dados normalizados e não altera os valores persistidos;
- [ ] combinações de filtros mantêm total e itens consistentes;
- [ ] detalhe inexistente retorna erro público previsível;
- [ ] query não executa N+1 nem carrega relações fora do contrato;
- [ ] plano e índices são avaliados com volume representativo;
- [ ] response é validada e não expõe campos internos.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/patrimonios/`;
- `apps/api/test/patrimonios.e2e-spec.ts` e testes de integração;
- `packages/database/prisma/schema.prisma` e migration somente se a evidência de
  query justificar novos índices;
- documentação de estado e roadmaps, somente após verificação.

## Verificações esperadas

- `corepack pnpm --filter @repo/contracts test`;
- `corepack pnpm --filter @repo/database typecheck` se o schema mudar;
- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test`;
- `corepack pnpm --filter @repo/api build`;
- integração PostgreSQL com volume e combinações de filtros representativas;
- plano de execução para as queries críticas, em ambiente seguro;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
