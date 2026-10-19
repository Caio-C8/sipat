# `CONTRACTS-006` — Contratos de processos de compra e notas fiscais

**Status:** `concluída`

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

- [x] nota sem arquivo não exige placeholder em `anexos`;
- [x] a 21ª nota, o 21º arquivo ou a 22ª parte é rejeitada;
- [x] índice repetido, ausente, fora do limite ou arquivo sem nota é rejeitado;
- [x] no máximo um PDF de 10 MiB é associado a cada nota;
- [x] datas civis, decimais e campos controlados pelo servidor são explícitos;
- [x] contratos JSON e multipart possuem testes e exports públicos.

## Resultado entregue

- contratos públicos de params, criação, alteração, listagem, resumo e detalhe
  de processos de compra e notas fiscais;
- boundary `multipart/form-data` com o campo textual `dados`, partes `anexos`
  opacas e associação total e exclusiva por `anexoIndice`;
- constantes públicas para configurar um campo, até 20 arquivos, até 20 notas,
  21 partes e 10 MiB por PDF no parser do consumidor;
- responses estritas expõem somente `anexoUrl` derivada do identificador, sem
  caminho persistido;
- lint, typecheck e 69 testes de `@repo/contracts` passam;
- a fixture consumidora e a suíte da API passam com 282 testes; os 28 testes
  PostgreSQL permanecem ignorados sem a integração habilitada.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/processo-compra/`;
- `packages/contracts/src/nota-fiscal/`;
- `packages/contracts/src/index.ts` e teste da API pública;
- `apps/api/src/tests/processos-compra-multipart.contract.spec.ts`;
- `docs/contracts/roadmap.md` após verificação.

## Verificações executadas

- [x] lint, typecheck e testes de `@repo/contracts`;
- [x] fixtures de multipart exercitam o formato entregue ao consumidor API;
- [x] `git diff --check` e formatação dos arquivos afetados.

As verificações passaram em 19 de outubro de 2026. A implementação ficou
restrita a `packages/contracts`, à fixture consumidora da API e aos registros
documentais desta entrega; a configuração do parser e a validação do conteúdo
PDF permanecem nas entregas consumidoras `COMPRAS-001` e
`NOTAS-FISCAIS-001`.

## Pendências ou decisões bloqueantes

- Nenhuma.
