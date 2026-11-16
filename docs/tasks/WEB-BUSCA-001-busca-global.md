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
