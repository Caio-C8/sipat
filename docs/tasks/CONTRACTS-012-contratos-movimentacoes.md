# CONTRACTS-012 — Contratos de movimentações

**Status:** implementada e verificada em 28/10/2026.
**Planejamento aprovado:** 27/10/2026.

## Objetivo

Entregar somente schemas Zod, tipos, exports e testes de contratos para
consultar transferências individuais e confirmar até dez transferências comuns
atomicamente. Não existe entidade de lote.

## Contexto e dependências

- [RF13, RF19, UC13 e pendência de correções](../requisitos-SIPAT.md#rf13-transferência-de-patrimônios):
  fonte das regras de produto.
- [Workflow](../agents/workflow.md), [índice de contratos](../contracts/README.md),
  [convenções](../contracts/conventions.md), [erros](../contracts/errors.md),
  [integrações](../contracts/integrations.md) e [testes](../contracts/testing.md).
- [Roadmap](../contracts/roadmap.md#contracts-012--contratos-de-movimentações)
  e [permissões planejadas](../security-and-access.md#movimentações--política-implementada).
- [API dependente](./MOVIMENTACOES-001-transferir-consultar-patrimonios.md)
  e [Web dependente](./WEB-MOVIMENTACOES-001-integrar-movimentacoes.md).
- [Guia de execução](../../PROMPTS-MOVIMENTACOES.md).

Dependências existentes: baseline de respostas/paginação, contratos de
patrimônio, comissão, setor e inventário. Confirmar o código antes de executar.
Esta tarefa não depende de uma API de movimentações pronta.

O schema define UUID por transferência e não define código TR nem lote.
Na etapa de planejamento as migrations foram inspecionadas somente como arquivos; o banco foi consultado e atualizado na execução da API. Correções de inventário já produzem registros que devem continuar
legíveis, inclusive com observação nula. Contratos gerais estão entregues nesta tarefa.

## Escopo e desenho do contrato

Os nomes abaixo fixam a interface planejada; não indicam endpoints existentes.
Usar schemas estritos, tipos de input/output, helpers de resposta e paginação
do package. Não importar Prisma nem depender de runtime de servidor.

### Registro: POST /api/movimentacoes

Body:

- `chaveIdempotencia`: UUID técnico da confirmação, sem código visível;
- `comissaoId`: UUID comum;
- `observacao`: motivo comum obrigatório, trim, 1 a 2.000 caracteres;
- `itens`: de 1 a 10 objetos com `patrimonioId`, `setorOrigemEsperadoId`
  e `setorDestinoId`, todos UUID.

O limite textual reutiliza o baseline de texto longo de inventário. O campo
`setorOrigemEsperadoId` é uma pré-condição de concorrência: não autoriza gravar
uma origem enviada pelo cliente. A API deriva a origem real e a autoria.
Rejeitar duplicidade de patrimônio e origem esperada igual ao destino, com
issues nos paths dos itens; a API repete as validações contra o estado atual.

Não aceitar data, horário, usuário, status, origem histórica, identificador de
transferência, lote ou origem de registro como campos de escrita. Comissão,
motivo e instante são comuns e persistidos em cada registro individual.

Response de sucesso: envelope existente com `dados` como array de 1 a 10
transferências individuais, na ordem dos itens enviados; primeira gravação
retorna 201. Reenvio reconhecido retorna os mesmos registros, IDs, instantes e
resultado de sucesso, sem gravar novamente. Não existe resultado parcial.

### Consulta: GET /api/movimentacoes e /:movimentacaoId

- `movimentacaoId`: UUID de um registro individual.
- Query: paginação existente (`pagina=1`, `limite=20`, máximo 50);
  `busca` opcional (trim, 1 a 200 caracteres, número patrimonial ou descrição);
  filtros UUID opcionais `patrimonioId`, `setorOrigemId`,
  `setorDestinoId`, `comissaoId`; `dataInicio` e `dataFim` opcionais,
  datas civis válidas YYYY-MM-DD com início não posterior ao fim.
- Os filtros combinam-se por interseção. Cada extremo do período pode ser
  informado sozinho. Os dias são inclusivos em America/Sao_Paulo; a API converte
  para intervalo de instantes, incluindo todo o último dia.
- Ordem fixa: `dataTransferencia DESC, id DESC`; sem ordenação arbitrária.
- Listagem paginada; detalhe no envelope de sucesso existente.

Resumo individual: `id`, `patrimonio` (id, numeroPatrimonio,
tipoNumeroPatrimonial, descricao), `setorOrigem` e `setorDestino` (id, nome),
`comissao` (id, nome), `dataTransferencia` e `origemRegistro`
(`COMUM` ou `CORRECAO_INVENTARIO`).
Detalhe acrescenta `observacao` (string ou null), `createdAt`,
`registradoPor` (id, nome) e `correcaoInventario`:
null para COMUM; objeto com `inventarioId` e `itemInventarioId` para correção.
Não aplicar à leitura de observações antigas a obrigatoriedade/normalização da
nova escrita. Datas de response seguem o padrão ISO UTC do package, com
milissegundos; a apresentação usa America/Sao_Paulo.
Nomes e descrições relacionados são valores cadastrais consultados, não snapshots
históricos inexistentes. Não apresentar responsável atual como responsável
histórico. Não expor credenciais, documentos pessoais ou models completos.

### Consultas auxiliares específicas

Planejar GET /api/movimentacoes/opcoes/setores e
GET /api/movimentacoes/opcoes/comissoes, com paginação existente, `busca`
opcional de até 200 caracteres e `contexto` obrigatório:
`REGISTRO` ou `FILTRO`.

- REGISTRO: apenas diretor; setores de destino ativos e comissões vigentes no
  dia corrente do servidor em America/Sao_Paulo. Seleção não substitui
  revalidação na confirmação. Bloqueios de inventário continuam na API.
- FILTRO: diretor e administrador; permitir localizar também setores inativos
  e comissões vencidas para consultar histórico. Não conceder acesso ao CRUD.
- Setor: id, nome, ativo e responsável atual (id, nome), apenas para informação
  no formulário; não transferir diretamente para responsável.
- Comissão: reutilizar a semântica do resumo existente (id, nome, numeroAto
  nullable e vigência civil), sem integrantes ou auditoria administrativa.
- Ordenação auxiliar determinística por nome e id.

A seleção de bens reutiliza GET /api/patrimonios e seu contrato; não alterar
esse contrato nem criar contrato de elegibilidade sem necessidade aprovada.

### Erros e reenvios

Reutilizar `RespostaErroSchema`; não mudar o envelope compartilhado.
Publicar constantes/tipos de códigos do domínio, sem duplicar o schema global:

- 400: `VALIDACAO_ENTRADA_INVALIDA` para tamanho, formato, campos não aceitos,
  motivo vazio e patrimônio repetido;
- 404: `MOVIMENTACAO_NAO_ENCONTRADA` no detalhe;
- 409: `MOVIMENTACAO_IMPEDIDA`, com causas em `erros[]`:
  `PATRIMONIO_NAO_ENCONTRADO`, `PATRIMONIO_NAO_ATIVO`,
  `ORIGEM_ALTERADA`, `DESTINO_NAO_ENCONTRADO`, `DESTINO_INATIVO`,
  `DESTINO_IGUAL_ORIGEM`, `SETOR_EM_INVENTARIO_PENDENTE`,
  `SETOR_EM_INVENTARIO_EM_ANDAMENTO`, `DESTINO_FORA_INVENTARIO_ABERTO`,
  `COMISSAO_NAO_ENCONTRADA`, `COMISSAO_FORA_DA_VIGENCIA`;
- 409: `CHAVE_IDEMPOTENCIA_REUTILIZADA` para mesma chave e conteúdo diferente;
  `MOVIMENTACAO_EM_PROCESSAMENTO` ou `CONFLITO_CONCORRENTE_MOVIMENTACAO`
  quando não for possível concluir/recuperar ainda;
- 401/403 e demais erros de infraestrutura seguem o baseline.

Paths públicos: `itens.0.patrimonioId`, `itens.0.setorOrigemEsperadoId`,
`itens.0.setorDestinoId`, `comissaoId`, `observacao` e
`chaveIdempotencia`. Usar os índices originais, não a ordem de locks internos.
Uma falha impede todos os itens, mas identifica os campos corrigíveis.
Comportamento persistente de idempotência pertence à tarefa da API; os testes
desta tarefa validam somente o formato e a semântica expressável em schemas.

## Referências visuais

[Consulta](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3229),
[seleção](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3471),
[destinos](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-3728)
e [revisão, elemento do frame](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=303-4123).
Fluxo aprovado com adaptações descritas na tarefa Web; o Figma não prevalece
sobre RF13 nem exige data manual, código TR ou entidade de lote.

## Fora do escopo

API, DTOs NestJS, queries, transações, schema Prisma, migrations, Web, alteração
dos contratos de correção de inventário, outras operações patrimoniais e
bibliotecas transversais. Não implementar as tarefas dependentes automaticamente.

## Critérios de aceite

- [x] Schemas aceitam 1 e 10 itens e rejeitam 0, 11 e UUIDs inválidos.
- [x] Motivo ausente, null, vazio/apenas espaços e acima de 2.000 é rejeitado;
      motivo válido é normalizado; duplicidades apontam o item repetido.
- [x] Escrita rejeita campos de data, auditoria, lote e tipo de origem.
- [x] Origem esperada é pré-condição explícita; destino igual é rejeitado.
- [x] Responses cobrem sucesso de vários registros sem lote, detalhe individual,
      correção com vínculo e observação nula, sem dados internos.
- [x] Query cobre paginação 20/50, filtros combinados, datas inválidas,
      período invertido e ordenação documentada.
- [x] Auxiliares distinguem REGISTRO e FILTRO sem alterar contratos administrativos.
- [x] Erros preservam envelope e paths por item; schemas não prometem testar
      permissões, vigência real, concorrência ou persistência.
- [x] Exports e tipos input/output estão disponíveis sem dependência de banco.
- [x] Verificações do package passam; consumidores afetados são verificados e
      limitações externas ao escopo são relatadas.

## Arquivos de referência e alterações previstas

Existentes: `packages/contracts/src/index.ts`, `src/common/`,
`src/patrimonio/`, `src/inventario/`, `src/comissao/`, `src/setor/`
(todos sob packages/contracts), `packages/database/prisma/schema.prisma`
e migrations (somente leitura).
Proposto: `packages/contracts/src/movimentacao/`, schemas, index e testes.
Documentação de estado: esta tarefa, roadmap de contratos e guia, somente após
verificação real; não marcar API/Web como implementadas.

## Verificações esperadas e pendências

Executar `pnpm --filter @repo/contracts lint`, `typecheck` e `test`;
typecheck dos consumidores afetados. Confirmar scripts e dependências antes.
No planejamento de 27/10/2026 não havia contratos executáveis ou testes desta capacidade; a execução está registrada abaixo.

Não há decisão de produto bloqueante para CONTRACTS-012. A revisão futura da
vigência em correções está fora deste ciclo, conforme RF19. A execução da API
depende da conclusão verificada desta tarefa, não apenas de sua aprovação.

## Evidência de execução — 28/10/2026

Implementados `packages/contracts/src/movimentacao/`, export público, schemas
estritos, tipos input/output, erros de domínio e testes de semântica.
`lint`, `typecheck` e `test` de @repo/contracts passaram (123 testes).
Typecheck de @repo/api, @repo/web e @repo/mobile passou antes da etapa da API.
Runtime local existente: Node 24.22.1 e pnpm 11.28.8. A conclusão desta tarefa
não substitui os testes transacionais e de permissões da tarefa da API.
