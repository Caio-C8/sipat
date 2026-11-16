# `WEB-INVENTARIOS-002` — Evoluir consulta, edição e finalização

**Status:** `implementada e validada localmente em 16/11/2026`

## Objetivo

Completar o ciclo Web de inventários com consulta padronizada, edição segura do
inventário pendente e finalização pelo Diretor usando a regra já existente.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF19](../requisitos-SIPAT.md#rf19-inventário-patrimonial).
- Backend existente: [INVENTARIOS-001](./INVENTARIOS-001-criar-consultar-inventarios.md),
  [INVENTARIOS-002](./INVENTARIOS-002-conferir-corrigir-finalizar.md) e
  [INVENTARIOS-003](./INVENTARIOS-003-consulta-administrador.md).
- Fundações: [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md) e
  [SEC-002](./SEC-002-matriz-leitura-compartilhada.md).

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

- listar por nome, comissão e situação, com Combobox, tabela e paginação comuns;
- remover o aviso azul instrucional;
- transformar criação e edição em modais roteáveis com página completa no
  acesso direto;
- criar contrato e `PATCH /inventarios/:inventarioId` para nome, descrição,
  observação e comissão, somente pelo Diretor e somente em `PENDENTE`;
- revalidar status e comissão sob transação/lock; após iniciar qualquer setor,
  os quatro campos ficam imutáveis;
- manter o detalhe operacional como página completa;
- adicionar ao detalhe botão Web de finalização somente para Diretor;
- bloquear ação enquanto houver setor não concluído e mostrar progresso;
- se houver correções pendentes, mostrar quantidade e exigir a confirmação
  explícita já prevista por `confirmarCorrecoesPendentes`;
- atualizar o detalhe para somente leitura após sucesso e preservar o destino
  `?visao=pendentes` usado pelo dashboard.

## Fora do escopo

- exigir correção de todas as divergências antes de finalizar;
- conferir bens/setores pela Web;
- reabrir inventário ou editar inventário iniciado/finalizado;
- alterar a população snapshot criada pelo inventário.

## Decisões aprovadas

- Administrador consulta; Diretor cria, edita enquanto pendente, corrige e
  finaliza;
- finalização é ação no detalhe, não nova página isolada;
- detalhe grande não abre em modal;
- mudança de comissão não reescreve fatos já iniciados porque é proibida depois
  da transição para `EM_ANDAMENTO`.

## Critérios de aceite

- [x] interface usa primitives shadcn, tokens e composições compartilhadas sem
      duplicar controles equivalentes.
- [x] controles seguem a semântica de Input, Textarea, Checkbox, Select e
      Combobox; teclado, foco, loading, disabled, contraste e reflow permanecem
      funcionais.
- [x] erros de campo, erros gerais, toasts, alerts persistentes e confirmações
      destrutivas seguem os critérios desta task, com mensagens orientadas à
      ação e sem detalhes técnicos.
- [x] qualquer evolução de contrato feita para melhorar feedback possui
      cobertura de validação, API, consumidores, testes e documentação, sem
      enfraquecer autorização ou alterar regra de negócio silenciosamente.

- [x] filtros e paginação preservam URL e funcionam nos dois perfis.
- [x] URL direta de criação/edição renderiza página e navegação interna usa modal.
- [x] API recusa edição concorrente ou fora de `PENDENTE` com `409` público.
- [x] Administrador recebe `403` em edição/finalização e não vê ações.
- [x] finalização sem setores concluídos é impedida.
- [x] correções pendentes exigem confirmação, mas não bloqueiam após confirmação.
- [x] inventário finalizado fica integralmente somente leitura.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/inventario/`;
- `apps/api/src/modules/inventarios/` e testes;
- `apps/web/app/(sistema)/inventarios/` com rotas paralelas/interceptadas;
- `apps/web/features/inventarios/`;
- navegação, dashboard e E2E de inventários.

## Verificações esperadas

- contratos, API e Web: lint, tipos e testes;
- build Web;
- migrations não são esperadas; qualquer necessidade deve ser justificada;
- API E2E e Web E2E nos dois perfis com PostgreSQL descartável;
- concorrência de edição/início/finalização;
- teclado, foco, zoom e viewports previstos.

## Evidências de validação

- `origin/main` e o checkout local confirmados no mesmo commit `698d235` antes
  da rodada final; marcadores textuais deixados pela reaplicação de stash foram
  reconciliados preservando a fundação da `main` e esta entrega.
- contratos: lint e tipos sem erros; 158 testes aprovados em 32 suítes.
- API: lint e tipos sem erros; 18 testes unitários/E2E localizados aprovados,
  incluindo `401`, `403`, CSRF e `PATCH`; 16 testes de integração aprovados em
  PostgreSQL 17 descartável após aplicar as 29 migrations.
- Web: lint e tipos sem erros; 147 testes aprovados; build de produção Next.js
  aprovado com 41 páginas; dois cenários Playwright aprovados no Chromium para
  Diretor e Administrador, incluindo modal roteável, edição, finalização,
  reflow em 390 px e Axe sem violações no conjunto verificado.
- não foi necessária migration. O PostgreSQL e os servidores locais
  descartáveis foram encerrados após a execução.

O E2E de navegador usa o servidor simulado estrito da própria suíte Web. A
persistência, os locks e a concorrência foram validados separadamente contra
PostgreSQL real; não foi executado nesta rodada um navegador ligado à API real
e ao mesmo banco.

## Pendências ou decisões bloqueantes

- Nenhuma.
