# `NOTAS-FISCAIS-001` — Gerenciar notas fiscais e anexos

**Status:** `concluída`

## Objetivo

Implementar operações posteriores de notas fiscais e entregar seus PDFs por
uma rota autenticada do próprio domínio.

## Contexto e referências

- Roadmap: [NOTAS-FISCAIS-001](../roadmap.md#notas-fiscais-001--gerenciar-notas-fiscais-e-anexos).
- Contratos: [CONTRACTS-006](./CONTRACTS-006-processos-compra-notas-fiscais.md).
- Dependências: [COMPRAS-001](./COMPRAS-001-gerenciar-processos-compra.md) e
  [STORAGE-001](./STORAGE-001-armazenamento-local-documentos.md).
- Requisitos: RF09, UC09, RNF05, RNF06, RNF09 e RNF11 em
  [Requisitos do SIPAT](../requisitos-SIPAT.md).
- Decisão: [armazenamento local](../file-storage.md).

## Escopo

- `GET /api/notas-fiscais` e `GET /api/notas-fiscais/:notaFiscalId`;
- `POST /api/notas-fiscais` multipart para acrescentar nota a processo;
- `PATCH /api/notas-fiscais/:notaFiscalId` para metadados permitidos;
- `PUT /api/notas-fiscais/:notaFiscalId/anexo` para incluir ou substituir PDF;
- `DELETE /api/notas-fiscais/:notaFiscalId/anexo` para remover somente o PDF;
- `GET /api/notas-fiscais/:notaFiscalId/anexo` para streaming autenticado;
- acesso de `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`;
- compensação imediata e reconciliação de arquivos órfãos;
- auditoria das mutações e responses com `anexoUrl` derivada do `id`.

O RF09 autoriza registrar e alterar documentos fiscais, mas não define a
exclusão de seus registros. Por isso, esta entrega não cria
`DELETE /api/notas-fiscais/:notaFiscalId`: o `DELETE` aprovado remove somente o
anexo e preserva a nota e a rastreabilidade fiscal.

## Fora do escopo

- `ServeStaticModule`, diretório público e rota genérica `/api/uploads`;
- exclusão física da nota ou do processo;
- Web e mobile;
- anexos de baixa e manutenção.

## Decisões aprovadas

- o banco guarda `uploads/notas-fiscais/<nome>.pdf`;
- o nome usa número normalizado, data UTC, UUID e `.pdf`;
- substituir persiste a nova referência antes de remover o arquivo anterior;
- remover arquivo não remove a nota;
- a URL consumível é a rota por `notaFiscalId`, não o caminho persistido.

## Critérios de aceite

- [x] sessão ausente recebe `401` em todas as rotas;
- [x] PDF maior que 10 MiB ou conteúdo incompatível é rejeitado;
- [x] download transmite o PDF sem revelar caminho físico;
- [x] substituição bem-sucedida remove o arquivo antigo;
- [x] falha antes ou depois da persistência é compensada ou reconciliada sem
      remover o arquivo ainda referenciado;
- [x] remoção é idempotente e não apaga o registro fiscal;
- [x] chave malformada, traversal e arquivo sem referência não são servidos.

## Resultado entregue

- módulo `notas-fiscais` com listagem paginada, detalhe, criação multipart,
  alteração de metadados e inclusão, substituição, remoção e leitura do PDF;
- autorização explícita para `ADMINISTRADOR` e `DIRETOR_PATRIMONIO`, mantendo
  autenticação e CSRF nos Guards globais;
- upload em disco limitado a 10 MiB, validação de extensão, MIME e assinatura
  PDF e remoção do temporário ao encerrar a request;
- streaming privado com `Content-Type`, `Content-Disposition`,
  `Content-Length` e `Cache-Control`, sem expor a chave persistida;
- troca otimista da referência para preservar o arquivo ainda válido sob
  concorrência, compensação imediata e reconciliação na inicialização com
  carência de 24 horas;
- teste do rewrite Web existente para
  `/api/backend/notas-fiscais/:notaFiscalId/anexo`, sem interface nova.

## Arquivos ou módulos potencialmente afetados

- `apps/api/src/modules/notas-fiscais/`;
- infraestrutura criada por `STORAGE-001`;
- integração por services com processos e fornecedores;
- `apps/api/src/app.module.ts`;
- testes unitários, E2E, multipart, streaming e filesystem;
- documentação de estado após verificação.

## Verificações esperadas

- lint, typecheck, testes e build dos packages afetados;
- E2E com Guards reais, CSRF nas mutações e cookie na leitura;
- testes de `Content-Type`, `Content-Disposition`, tamanho e streaming;
- matriz de falhas de substituição/remoção e ausência de órfãos;
- teste pelo rewrite `/api/backend/notas-fiscais/:id/anexo`, sem criar UI;
- `git diff --check` e formatação.

## Verificações executadas

- geração do Prisma Client, lint, typecheck e build de `@repo/api`: passaram;
- suíte completa de `@repo/api`: 304 testes passaram e 30 testes de integração
  preexistentes ficaram ignorados sem as variáveis de banco correspondentes;
- E2E específico com Guards e CSRF reais: 8 testes passaram, incluindo limite
  multipart, streaming, substituição, remoção e referências inválidas;
- testes focados de service, filesystem e regressão de processos de compra: 23
  testes passaram;
- teste do rewrite e lint do arquivo afetado em `@repo/web`: passaram;
- formatação e `git diff --check`: passaram.

As verificações foram executadas em 19 de outubro de 2026. Os testes que usam
filesystem e sockets loopback precisaram ser executados fora do sandbox do
agente; nenhum serviço externo foi acessado.

## Pendências ou decisões bloqueantes

- Nenhuma.
