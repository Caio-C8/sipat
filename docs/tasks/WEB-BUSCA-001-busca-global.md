# `WEB-BUSCA-001` — Implementar busca global por domínios

**Status:** `aprovada`

## Objetivo

Tornar a pesquisa do shell funcional por uma única rota agregada, agrupando
resultados compartilhados e respeitando a autorização do usuário autenticado.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Requisito: [RF22](../requisitos-SIPAT.md#rf22-busca-global).
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md),
  [WEB-SHELL-002](./WEB-SHELL-002-navegacao-estados-globais.md) e verticais Web
  com destinos canônicos concluídos.

## Escopo

- criar contrato e `GET /api/busca`, com termo finito, limite por grupo e
  response discriminada por domínio;
- pesquisar patrimônios, reavaliações, depreciações, movimentações,
  empréstimos, baixas, inventários, manutenções, processos de compra,
  fornecedores, setores, responsáveis, comissões, naturezas e espécies;
- excluir usuários e itens que são somente destinos de navegação;
- aplicar filtros de perfil e seleções mínimas no backend;
- retornar no máximo cinco itens por grupo, total truncado e destino canônico;
- ativar pesquisa na topbar com debounce/cancelamento, loading, vazio, erro,
  grupos, teclado e link `Ver todos` quando houver listagem filtrável;
- usar número patrimonial, `Pedido #n` e demais identificadores humanos; nunca
  exibir UUID como título;
- avaliar índices e custo das consultas sem executar quinze requests do browser.

## Fora do escopo

- pesquisar usuários;
- motor externo, fuzzy search ilimitada ou ranking por aprendizado;
- indexar documentos/PDFs ou conteúdo sensível;
- permitir mutation a partir dos resultados.

## Decisões aprovadas

- a API agrega a busca; a Web realiza uma chamada cancelável por termo;
- o resultado só aponta para rotas que o perfil pode consultar;
- cada domínio define seus campos pesquisáveis sem concatenar payloads completos;
- busca não substitui filtros/listagens específicas.

## Critérios de aceite

- [ ] os quinze grupos aprovados possuem cobertura com e sem resultado.
- [ ] Usuários nunca aparecem, inclusive para Administrador.
- [ ] Diretor encontra cadastros administrativos somente para leitura.
- [ ] requests antigos são cancelados/ignorados e não sobrescrevem termo novo.
- [ ] teclado percorre grupos e devolve foco corretamente ao fechar.
- [ ] UUID, segredo, anexo e campo interno não aparecem na response.
- [ ] consulta possui limites, ordenação determinística e plano avaliado.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/busca/`;
- `apps/api/src/modules/busca/` e repositories/consultas dos domínios;
- `apps/web/components/shared/system-topbar.tsx` e feature de busca;
- catálogo de rotas/destinos;
- testes de contratos, API, Web e performance de consulta.

## Verificações esperadas

- contratos, API e Web: lint, tipos, testes e build;
- E2E nos dois perfis, com termos cruzando múltiplos domínios;
- autorização negativa e ausência de usuários/dados privados;
- cancelamento, debounce, teclado, foco, axe e viewport estreita;
- `EXPLAIN`/índices em PostgreSQL descartável com volume realista.

## Pendências ou decisões bloqueantes

- Nenhuma.
