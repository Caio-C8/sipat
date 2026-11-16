# `WEB-DASHBOARD-002` — Entregar a visão geral operacional

**Status:** `aprovada`

## Objetivo

Substituir o resumo patrimonial limitado por um dashboard operacional real,
personalizado e navegável, carregado por uma única rota agregada.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF23](../requisitos-SIPAT.md#rf23-visão-geral-operacional).
- Estado: [WEB-DASHBOARD-001](./WEB-DASHBOARD-001-integrar-visao-geral.md) e
  contrato `DashboardPatrimonialResponseSchema`.
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md),
  [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md) e
  [WEB-PATRIMONIOS-002](./WEB-PATRIMONIOS-002-evolucao-experiencia.md).

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

- criar `GET /api/dashboard`, autorizado para os dois perfis, com response
  compartilhada e `private, no-store`;
- retornar numa única consulta lógica totais, pendências de inventário,
  manutenções, depreciação, cinco setores e três atividades do usuário atual;
- calcular 14 dias completos com datas civis em `America/Sao_Paulo`;
- inventário usa a data da verificação/localização que originou a correção;
- manutenção usa data de envio e itens sem retorno;
- depreciação usa a competência devida mais antiga e aparece somente quando o
  perfil pode consultar o destino;
- filtrar atividades por autoria da identidade e cobrir cadastro, substituição,
  movimentação, baixa, empréstimo/devolução, manutenção, reavaliação,
  depreciação e inventário quando houver autor persistido;
- mostrar até três inventários, três manutenções e uma competência, com links
  filtrados, além de `Setores com mais patrimônios` e
  `Últimas atividades realizadas por você`;
- migrar a Web e retirar `/patrimonios/dashboard` após confirmar todos os
  consumidores e atualizar documentação/testes.

## Fora do escopo

- central de notificações, lido/não lido ou badge;
- vários requests da Web por card;
- analytics, gráficos ou séries históricas;
- atribuir evento sem autor conhecido ao usuário atual.

## Decisões aprovadas

- setores desconsideram patrimônios `BAIXADO`;
- atividade abre `/patrimonios/:id?aba=historico`;
- inventário abre `?visao=pendentes`, manutenção abre o pedido e depreciação
  abre `?competencia=AAAA-MM`;
- a API recebe a identidade pelo Guard, não por query.

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

- [ ] a Web realiza uma única chamada agregada para montar o dashboard.
- [ ] limites, ordenação e desempates são determinísticos.
- [ ] nenhuma atividade de outro usuário aparece no bloco pessoal.
- [ ] links restauram exatamente o filtro/contexto anunciado.
- [ ] Administrador e Diretor recebem somente blocos autorizados.
- [ ] vazio e falha parcial/global possuem estado claro sem dados fictícios.
- [ ] consulta permanece finita e possui índices/planos avaliados.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/dashboard/` ou módulo compartilhado equivalente;
- `apps/api/src/modules/dashboard/` e composição do `AppModule`;
- consultas SQL/repositories dos domínios envolvidos;
- `apps/web/app/(sistema)/dashboard/page.tsx` e `apps/web/app/_home/`;
- operação Web de dashboard, mocks e E2E;
- `docs/contracts/README.md` e integração Web–API.

## Verificações esperadas

- contratos, API e Web: lint, tipos, testes e build;
- testes de datas nos limites de 14 dias e virada de competência/fuso;
- E2E dos dois perfis com PostgreSQL descartável e eventos de vários autores;
- inspeção de query/índices e limite de resposta;
- acessibilidade, teclado e responsividade do dashboard.

## Pendências ou decisões bloqueantes

- Nenhuma.
