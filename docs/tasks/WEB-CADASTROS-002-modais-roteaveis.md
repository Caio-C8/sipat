# `WEB-CADASTROS-002` — Padronizar cadastros e modais roteáveis

**Status:** `aprovada`

## Objetivo

Reorganizar os cadastros administrativos como páginas independentes, com
criação/edição roteáveis, ações coerentes e leitura para o Diretor conforme a
matriz aprovada.

## Contexto e referências

- Roadmap: [evolução Web](../apps/web/roadmap.md#evolução-web-de-usabilidade-e-padronização).
- Estado: `WEB-CADASTROS-001` no [roadmap Web](../apps/web/roadmap.md) e
  [WEB-FORNECEDORES-001](./WEB-FORNECEDORES-001-gestao-fornecedores.md).
- Requisitos: RF02–RF09 e RNF05 em [requisitos](../requisitos-SIPAT.md).
- Dependências: [SEC-002](./SEC-002-matriz-leitura-compartilhada.md),
  [WEB-UI-001](./WEB-UI-001-fundacao-visual-formularios.md) e
  [WEB-SHELL-002](./WEB-SHELL-002-navegacao-estados-globais.md).

## Escopo

- manter páginas independentes para processos de compra, fornecedores,
  setores, responsáveis, comissões, naturezas, espécies e usuários;
- retirar a navegação interna que simula uma segunda sidebar/abas de cadastros;
- usar rotas canônicas para criar/editar e rotas interceptadas para abrir modal
  a partir da listagem, com página completa em URL direta/refresh;
- aplicar filtros, tabelas, paginação, campos, erros e feedback comuns;
- colocar ativar/inativar no formulário de edição das entidades que suportam
  situação, com confirmação e preservação histórica;
- Administrador mantém todas as mutações administrativas; Diretor recebe
  somente lista/detalhe de fornecedores, setores, responsáveis, comissões,
  naturezas e espécies;
- processos de compra permanecem integralmente disponíveis aos dois perfis;
- usuários permanecem exclusivos do Administrador;
- preservar notas, anexos, integrantes, locks e demais regras existentes.

## Fora do escopo

- transformar patrimônio, manutenção ou ações patrimoniais complexas em modal;
- permitir mutation administrativa ao Diretor;
- unificar contratos distintos em formulário dinâmico universal;
- exclusão física de cadastros históricos.

## Decisões aprovadas

- modal usa `Cancelar`; página de criação usa `Limpar`; edição direta usa
  `Restaurar alterações`;
- cada feature define seus campos/colunas sobre primitives compartilhadas;
- status inativo continua consultável nos contextos administrativos aprovados;
- fechar modal após sucesso atualiza a listagem e preserva seus filtros.

## Critérios de aceite

- [ ] cada cadastro possui URL canônica que funciona sem navegação anterior.
- [ ] abertura pela lista usa modal e refresh usa página completa equivalente.
- [ ] Diretor consulta os seis catálogos e não encontra controles de mutation.
- [ ] API retorna `403` se o Diretor tentar mutar por chamada direta.
- [ ] ativação/inativação fica junto da edição e exige confirmação.
- [ ] processos, notas, anexos e comissões não sofrem perda funcional.
- [ ] foco, histórico do navegador e botão Voltar funcionam nos modais.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(sistema)/cadastros/` e `apps/web/app/(sistema)/usuarios/`;
- `apps/web/features/{processos-compra,fornecedores,setores,responsaveis,comissoes,naturezas,especies,usuarios}/`;
- rotas paralelas/interceptadas do App Router;
- componentes compartilhados de formulário/lista;
- testes Web e E2E dos cadastros.

## Verificações esperadas

- lint, tipos, testes e build Web;
- regressão de contratos/API quando houver consumidor alterado;
- E2E com os dois perfis e PostgreSQL/arquivos descartáveis;
- navegação direta, refresh, Voltar/Avançar, teclado, foco e Escape;
- axe, zoom e viewports previstos.

## Pendências ou decisões bloqueantes

- Nenhuma.
