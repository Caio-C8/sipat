# `WEB-MANUTENCOES-003` — Identificar pedidos e simplificar itens

**Status:** `aprovada`

## Objetivo

Dar identificação humana aos pedidos de manutenção e simplificar seleção e
preenchimento por item, preservando o ciclo funcional já validado para os dois
perfis.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF18](../requisitos-SIPAT.md#rf18-gestão-de-manutenções).
- Estado: [MANUTENCOES-001](./MANUTENCOES-001-api-persistencia-manutencoes.md),
  [WEB-MANUTENCOES-001](./WEB-MANUTENCOES-001-interface-manutencoes.md) e
  [WEB-MANUTENCOES-002](./WEB-MANUTENCOES-002-paridade-visual-figma.md).
- Fundação: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md).

## Diretrizes obrigatórias de interface e feedback

- Padronizar a interface usando as primitives do shadcn como base para tabelas,
  campos, botões, dialogs, drawers, cards, alerts e demais controles. Não criar
  componentes visuais paralelos quando já houver primitive equivalente.
- Escolher controles pela semântica: `Input` para texto curto, `Textarea` para
  conteúdo longo, `Checkbox` para booleanos, `Select` para poucas opções
  fixas e `Combobox` para listas extensas, remotas ou pesquisáveis.
- Extrair para `components/shared` somente composições realmente reutilizadas
  por domínios distintos. Regras de negócio, permissões e estados específicos
  permanecem nas respectivas features.
- São permitidas mudanças de composição, hierarquia, agrupamento, espaçamento e
  apresentação visual quando melhorarem clareza e usabilidade, desde que
  preservem os requisitos funcionais e sigam o padrão visual já estabelecido.
- Centralizar cores em tokens e seguir a paleta: primário `#1E3A5F`, azul
  profundo `#0F2644`, apoio `#2A4F7A`, dourado `#D4A017`, dourado claro
  `#F5C842`, interativo `#2563EB`, fundo `#F8FAFC`, superfície `#FFFFFF`,
  texto `#0F172A`, texto auxiliar `#64748B` e borda `#E2E8F0`.
- Usar foco dourado de 3 px com afastamento de 2 px e nunca depender somente de
  cor para comunicar estado, prioridade ou resultado.
- Aplicar feedback conforme o tipo:
  - erro de campo fica abaixo do controle, com `aria-invalid`, borda vermelha e
    foco no primeiro campo inválido;
  - erro geral que exige correção usa `Alert` acima do formulário, recebe
    scroll/foco e permanece visível até a correção;
  - toast é reservado a sucesso ou falha geral não bloqueante e nunca é o único
    lugar para erro de campo, aviso persistente ou instrução necessária;
  - aviso contextual usa `Alert` quando houver pré-condição, consequência
    importante, ação irreversível ou informação que precise permanecer visível;
    não criar caixas meramente instrucionais ou decorativas;
  - ações destrutivas usam variante destrutiva e confirmação explícita.
- Escrever mensagens claras e orientadas à ação, sem expor termos de API, banco,
  servidor, stack ou implementação. Preservar teclado, foco, loading, disabled,
  responsividade e contraste.
- É permitido evoluir contratos compartilhados e responses de erro quando isso
  for necessário para fornecer feedback seguro e útil, inclusive campo, código
  público, mensagem pública ou condição de nova tentativa. Toda mudança deve
  atualizar validação, API, consumidores, testes e documentação; preservar
  compatibilidade quando possível; e nunca alterar regra de negócio,
  autorização ou contrato externo silenciosamente, nem expor detalhes internos.

## Escopo

- adicionar `numeroPedido BIGINT`, único, imutável e gerado por sequence;
- retropreencher pedidos existentes em ordem determinística de criação/id;
- transportar o número como string decimal nos contratos JSON e exibir
  `Pedido #n`; não reutilizar `numeroRequisicao` nem UUID;
- cobrir geração concorrente e busca por número do pedido;
- aplicar filtros, tabela, paginação, feedback e sete casas monetárias do kit;
- melhorar a busca e seleção de patrimônios disponíveis;
- mostrar dados de cada item abaixo do bem selecionado em seção recolhível,
  com erros próprios, resumo, remoção segura e preservação dos dados digitados;
- pausar confirmação enquanto houver item incompleto e focar o primeiro erro;
- preservar orçamento, retorno, documentos, idempotência e permissões iguais
  para Administrador e Diretor.

## Fora do escopo

- alterar significado de `numeroRequisicao`/`numeroEmpenho`;
- reiniciar numeração por ano;
- excluir pedidos ou itens já confirmados;
- mudar regra de orçamento, retorno, garantia ou anexos.

## Decisões aprovadas

- sequência é global e gaps são aceitáveis;
- o banco usa `BIGINT`, enquanto API/Web usam string decimal;
- itens ficam inline e recolhíveis; não usam modal de configuração;
- ambos os perfis mantêm acesso total às operações existentes.

## Critérios de aceite

- [ ] interface usa primitives shadcn, tokens e composições compartilhadas sem
      duplicar controles equivalentes.
- [ ] controles seguem a semântica de Input, Textarea, Checkbox, Select e
      Combobox; teclado, foco, loading, disabled, contraste e reflow permanecem
      funcionais.
- [ ] erros de campo, erros gerais, toasts, alerts persistentes e confirmações
      destrutivas seguem os critérios desta task, com mensagens orientadas à
      ação e sem detalhes técnicos.
- [ ] qualquer evolução de contrato feita para melhorar feedback possui
      cobertura de validação, API, consumidores, testes e documentação, sem
      enfraquecer autorização ou alterar regra de negócio silenciosamente.

- [ ] migration aplica desde banco vazio e sobre histórico com backfill estável.
- [ ] pedidos concorrentes recebem números distintos e crescentes.
- [ ] lista, detalhe, busca e dashboard usam `Pedido #n`.
- [ ] UUID deixa de ser identificação visível, mas continua chave técnica da URL.
- [ ] seleção e seções de itens funcionam por teclado e em viewport estreita.
- [ ] erro de um item abre a seção correta e move o foco.
- [ ] orçamento, retorno, upload/download e idempotência não sofrem regressão.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `packages/contracts/src/manutencao/`;
- `apps/api/src/modules/manutencoes/`;
- `apps/web/app/(sistema)/manutencoes/` e `apps/web/features/manutencoes/`;
- dashboard, relatórios de manutenção, seed e fixtures;
- testes de migration, API, Web e integração real.

## Verificações esperadas

- histórico completo de migrations e `prisma migrate diff --exit-code` em
  PostgreSQL descartável;
- contratos, API e Web: lint, tipos, testes e build;
- concorrência real e backfill com dados legados fictícios;
- Web E2E nos dois perfis, incluindo documentos e retorno parcial;
- axe, teclado, reflow, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.
