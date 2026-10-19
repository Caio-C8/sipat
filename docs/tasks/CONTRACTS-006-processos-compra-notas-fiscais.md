# `CONTRACTS-006` — Contratos de processos de compra e notas fiscais

**Status:** `aprovada`

## Objetivo

Definir os contratos JSON e multipart de processos de compra, notas fiscais e
seus anexos privados antes da implementação da API.

## Contexto e referências

- Roadmap: [CONTRACTS-006](../roadmap.md#contracts-006--contratos-de-processos-de-compra-e-notas-fiscais).
- Requisitos: [RF09 e UC09](../requisitos-SIPAT.md#rf09-gestão-de-processos-de-compra-e-documentos-fiscais),
  RNF02, RNF03, RNF05, RNF06, RNF09 e RNF11.
- Decisão de arquivos: [armazenamento local](../file-storage.md).
- Contratos: [convenções](../contracts/conventions.md) e
  [integrações](../contracts/integrations.md).

## Escopo

- params, queries paginadas, criação, alteração, resumo e detalhe de processo;
- criação multipart de processo com zero a 20 notas;
- campo textual `dados` contendo JSON estrito e array de arquivos `anexos`;
- cada nota informa opcionalmente `anexoIndice`, único e válido no array;
- contratos próprios de nota para consulta, criação posterior, alteração de
  metadados, inclusão/substituição e remoção do anexo;
- responses expõem `anexoUrl` autenticada derivada do `id`, não caminho físico;
- limites de 20 notas, 20 arquivos, um campo `dados` e 21 partes multipart por
  criação de processo.

## Fora do escopo

- implementação de filesystem, API, Web ou mobile;
- exclusão física de processo ou nota fiscal;
- materiais de consumo.

## Critérios de aceite

- [ ] nota sem arquivo não exige placeholder em `anexos`;
- [ ] a 21ª nota, o 21º arquivo ou a 22ª parte é rejeitada;
- [ ] índice repetido, ausente, fora do limite ou arquivo sem nota é rejeitado;
- [ ] no máximo um PDF de 10 MiB é associado a cada nota;
- [ ] datas civis, decimais e campos controlados pelo servidor são explícitos;
- [ ] contratos JSON e multipart possuem testes e exports públicos.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/processo-compra/`;
- `packages/contracts/src/nota-fiscal/`;
- `packages/contracts/src/index.ts` e teste da API pública;
- `docs/contracts/roadmap.md` após verificação.

## Verificações esperadas

- lint, typecheck e testes de `@repo/contracts`;
- fixtures de multipart no consumidor API;
- `git diff --check` e formatação.

## Pendências ou decisões bloqueantes

- Nenhuma.
