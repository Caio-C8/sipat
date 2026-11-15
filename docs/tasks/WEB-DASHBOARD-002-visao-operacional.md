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
