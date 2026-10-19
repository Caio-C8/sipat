# `COMPRAS-001` — Gerenciar processos de compra

**Status:** `aprovada`

## Objetivo

Implementar cadastro conjunto, consulta e alteração de processos de compra com
zero a 20 notas fiscais e seus PDFs opcionais.

## Contexto e referências

- Roadmap: [COMPRAS-001](../roadmap.md#compras-001--gerenciar-processos-de-compra).
- Contratos: [CONTRACTS-006](./CONTRACTS-006-processos-compra-notas-fiscais.md).
- Dependências: [STORAGE-001](./STORAGE-001-armazenamento-local-documentos.md)
  e [FORNECEDORES-001](./FORNECEDORES-001-gerenciar-fornecedores.md).
- Requisitos: [RF09 e UC09](../requisitos-SIPAT.md#rf09-gestão-de-processos-de-compra-e-documentos-fiscais),
  RNF02, RNF05, RNF06, RNF09 e RNF11.
- Arquivos: [armazenamento local](../file-storage.md).

## Escopo

- `GET /api/processos-compra`,
  `GET /api/processos-compra/:processoCompraId`,
  `POST /api/processos-compra` multipart e
  `PATCH /api/processos-compra/:processoCompraId`;
- acesso de `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`;
- criação lógica única com `dados`, até 20 notas e até 20 arquivos mapeados por
  índice;
- fornecedor de cada nota existente e ativo em novos vínculos;
- fornecedores do processo derivados de suas notas fiscais;
- data de aquisição representada pela emissão da nota fiscal;
- transação de banco, staging de arquivos, compensação e auditoria;
- paginação, busca, filtros e seleção mínima.

## Fora do escopo

- exclusão de processo, patrimônio ou nota;
- materiais de consumo;
- operações posteriores e leitura do anexo, cobertas por `NOTAS-FISCAIS-001`;
- Web e mobile.

## Critérios de aceite

- [ ] processo pode ser criado sem nota ou com até 20 notas;
- [ ] cada nota aceita no máximo um PDF e cada arquivo mapeia uma única nota;
- [ ] fornecedor inativo ou inexistente impede novo vínculo;
- [ ] falha em qualquer nota, arquivo ou relação não deixa registros nem
      arquivos órfãos;
- [ ] operação concorrente preserva integridade e auditoria;
- [ ] responses não expõem caminhos físicos.

## Arquivos ou módulos potencialmente afetados

- schema/migration e client de `@repo/database`, se necessários;
- `apps/api/src/modules/processos-compra/`;
- integração por services com fornecedores, notas e armazenamento;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E, multipart e PostgreSQL;
- documentação de estado após verificação.

## Verificações esperadas

- geração do Prisma Client e migration sobre histórico completo;
- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards e CSRF reais, PDFs válidos/inválidos e limites;
- teste PostgreSQL de rollback e concorrência;
- teste de ausência de órfãos após cada falha injetada;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
