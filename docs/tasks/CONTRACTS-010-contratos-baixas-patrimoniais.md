# `CONTRACTS-010` — Contratos de baixas patrimoniais

**Status:** `concluída`

## Objetivo

Definir os contratos compartilhados para registrar e consultar a baixa única e
irreversível de um patrimônio, incluindo o multipart do PDF opcional, antes da
implementação do banco e da API.

## Contexto e referências

- Roadmap: [CONTRACTS-010](../roadmap.md#contracts-010--contratos-de-baixas-patrimoniais).
- Requisitos: [RF17](../requisitos-SIPAT.md#rf17-baixa-de-patrimônios),
  [UC17](../requisitos-SIPAT.md#uc17---baixar-patrimônio), RN04, RN05, RN11,
  RN15, RNF01, RNF05, RNF06, RNF08, RNF09 e RNF11.
- Contratos: [convenções](../contracts/conventions.md),
  [integrações](../contracts/integrations.md),
  [testes](../contracts/testing.md) e
  [roadmap](../contracts/roadmap.md#contracts-010--operações-de-baixas-patrimoniais).
- Dependências: [CONTRACTS-004](./CONTRACTS-004-contratos-patrimonios.md) e
  [CONTRACTS-007](./CONTRACTS-007-contratos-comissoes.md).
- Armazenamento: [documentos privados](../file-storage.md).
- Referências oficiais: [Zod 4](https://zod.dev/api) e
  [upload de arquivos no NestJS](https://docs.nestjs.com/techniques/file-upload).

## Escopo

- criar `packages/contracts/src/baixa-patrimonio/` com schemas, tipos derivados,
  testes e barrel próprio;
- exportar a feature pelo entrypoint público de `@repo/contracts` e proteger os
  exports no teste da API pública;
- expor `TIPOS_BAIXA_PATRIMONIO` e seu schema com `ALIENACAO`,
  `INUTILIZACAO`, `SINISTRO`, `FURTO`, `EXTRAVIO`, `TRANSFERENCIA`,
  `RECLASSIFICACAO`, `ABANDONO`, `ERRO_REGISTRO` e `OUTRO`, sem importar o enum
  do Prisma;
- reutilizar o params de patrimônio quando a semântica coincidir ou declarar um
  params explícito para `patrimonioId`, sem duplicar primitives UUID;
- definir `BaixarPatrimonioDadosSchema` estrito com `dataBaixa` em `YYYY-MM-DD`,
  `tipo`, `motivo`, `observacao` opcional e `comissaoId`;
- normalizar espaços externos e limitar `motivo` e `observacao` a 2.000
  caracteres; motivo vazio falha e observação ausente permanece ausente;
- validar apenas a representação de `dataBaixa` no contrato compartilhado; a
  comparação com o relógio do servidor pertence a `BAIXAS-001`;
- definir constantes e schemas do multipart com campo textual `dados`, campo de
  arquivo opcional `documento`, um arquivo, um campo, duas partes, extensão
  `.pdf`, MIME `application/pdf` e 10 MiB;
- definir `BaixaPatrimonioDetalheSchema` como allowlist com `id`, patrimônio,
  comissão, tipo, data, motivo, observação anulável, `createdById`, `createdAt`
  e `anexoUrl` anulável; a chave persistida não integra a response;
- definir envelopes de sucesso da criação e da consulta;
- registrar códigos públicos estáveis para baixa já existente, patrimônio não
  ativo, patrimônio em inventário aberto, comissão inválida e data futura,
  seguindo o catálogo de erros existente.

## Fora do escopo

- Prisma, migration, banco, NestJS ou filesystem;
- consultar banco ou relógio em refinements compartilhados;
- aceitar status, usuário, timestamps de auditoria, chave de arquivo ou URL no
  input;
- alteração, exclusão, estorno, substituição ou remoção de documento;
- listagem geral, baixa em lote ou histórico patrimonial agregado;
- Web e mobile.

## Decisões aprovadas

- toda baixa exige comissão; a vigência será validada pela API na data civil da
  baixa;
- `dataBaixa` é civil e não pode ser futura, mas datas passadas são aceitas;
- `motivo` é obrigatório e `observacao` é opcional;
- `TRANSFERENCIA` significa transferência permanente para fora do acervo, não
  movimentação entre setores;
- `RECLASSIFICACAO` significa desincorporação contábil, não alteração cadastral
  da espécie;
- `ERRO_REGISTRO` baixa o lançamento indevido sem excluí-lo ou reativá-lo;
- `OUTRO` não dispensa o motivo obrigatório;
- o documento é um único PDF opcional de até 10 MiB;
- não existe contrato de edição, remoção ou estorno.

## Critérios de aceite

- [x] os dez tipos são aceitos e qualquer outro valor é rejeitado;
- [x] payload mínimo, payload completo, texto vazio, excesso de tamanho, data
      inválida, UUID inválido, `null` indevido e propriedade extra possuem
      cobertura;
- [x] parsing do campo `dados` rejeita JSON inválido antes da regra de negócio;
- [x] constantes multipart expressam limites de bytes, arquivos, campos e
      partes;
- [x] responses representam datas em JSON, usam allowlist e nunca contêm chave
      ou caminho do documento;
- [x] schemas e tipos são exportados pela feature e pelo package;
- [x] lint, typecheck, testes e consumidores dos exports passam.

Concluída em 27 de outubro de 2026. A entrega reutiliza o params UUID e a data
civil de patrimônios, mantém a comparação com o relógio fora do contrato e
expõe limites multipart suficientes para a API configurar o parser antes do
upload. Lint, typecheck e 104 testes do package passaram, assim como o
typecheck dos consumidores API, Web e mobile.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/baixa-patrimonio/baixa-patrimonio-fields.schema.ts`;
- `packages/contracts/src/baixa-patrimonio/baixa-patrimonio-requests.schema.ts`;
- `packages/contracts/src/baixa-patrimonio/baixa-patrimonio-responses.schema.ts`;
- `packages/contracts/src/baixa-patrimonio/multipart.schema.ts`;
- `packages/contracts/src/baixa-patrimonio/tests/baixa-patrimonio.schema.test.ts`;
- `packages/contracts/src/baixa-patrimonio/index.ts`;
- `packages/contracts/src/index.ts`;
- `packages/contracts/src/public-api.test.ts` ou teste público equivalente;
- `docs/contracts/roadmap.md`, `docs/roadmap.md` e esta tarefa somente após as
  verificações correspondentes.

Confirme os nomes finais contra a organização real do package antes de criar
arquivos; os caminhos acima descrevem o corte esperado, não autorizam duplicar
schemas equivalentes já existentes.

## Verificações esperadas

- `pnpm --filter @repo/contracts lint`;
- `pnpm --filter @repo/contracts typecheck`;
- `pnpm --filter @repo/contracts test`;
- typecheck de API, Web e mobile somente para detectar regressões nos exports,
  sem implementar interfaces;
- Prettier nos arquivos alterados e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma.
