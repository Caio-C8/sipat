# Páginas e roteamento

## Estado atual

A aplicação Web do SIPAT expõe:

- `/`: entrada Server que encaminha para login, primeiro acesso ou dashboard;
- `/login`: autenticação integrada à API para usuários anônimos;
- `/esqueci-senha`: solicitação pública e neutra de recuperação por e-mail;
- `/recuperar-senha#token=…`: redefinição pública por token transitório;
- `/recuperacao-concluida`: confirmação pública sem dado sensível;
- `/redefinir-senha`: conclusão protegida do primeiro acesso;
- `/senha-atualizada`: confirmação protegida após a troca;
- `/dashboard`: visão geral protegida com totais, pendências, setores e atividades
  patrimoniais para os dois perfis;
- `/depreciacao`: consulta paginada da competência atual e execução individual
  ou em lote, exclusiva do Diretor de Patrimônio;
- `/inventarios` e `/inventarios/[inventarioId]`: consulta para Administrador e
  Diretor; abertura global e correções de divergências somente pelo Diretor;
- `/cadastros`: processos de compra e notas fiscais integrados para consulta
  e edição; o Administrador também pode incluir notas novas;
- `/cadastros/especies`, `/cadastros/naturezas` e `/cadastros/comissoes`:
  gestão administrativa integrada no fluxo anterior;
- `/cadastros/fornecedores`, `/cadastros/responsaveis` e `/cadastros/setores`
  possuem listas e detalhes para os dois perfis; as rotas `/novo` e
  `/[id]/editar` são exclusivas do Administrador, abrem modal em navegação
  iniciada pela lista e página completa em acesso direto ou refresh;
- `/cadastros/setores/[setorId]` preserva também a consulta dos bens vinculados;
- `/usuarios`, `/usuarios/novo`, `/usuarios/[usuarioId]` e
  `/usuarios/[usuarioId]/editar`: gestão administrativa integrada de usuários;
- `/movimentacoes` e `/movimentacoes/[movimentacaoId]`: consulta para ambos os perfis;
- `/movimentacoes/nova`: registro em três etapas somente pelo diretor;
- `/api/health`: health check da camada Web;
- `/api/backend/*`: rewrite interno para a API, não uma página navegável.

As páginas de autenticação e o layout do grupo `(sistema)` validam a identidade
pelo endpoint `/auth/me` nas fronteiras Server. O grupo não altera a URL e
compartilha o shell das páginas autenticadas; formulários, menus e logout ficam
em pequenas fronteiras Client. O dashboard faz uma leitura agregada no servidor;
movimentações acrescenta consulta/detalhe Server e formulário Client integrado.

Nos cadastros em lista e formulário, `id` seleciona o registro e `busca` e
`pagina` representam a consulta na URL. Setores usam rota individual e
`paginaBens` para paginar os patrimônios vinculados. As leituras Server
encaminham o cookie por requisição e desabilitam cache; os formulários usam
operações e hooks específicos com CSRF. Campos ilustrativos sem contrato,
como códigos NAT/ESP/COM e cargo/e-mail de responsável, não são enviados nem
simulados como dados persistidos.

## Matriz aprovada para WEB-AUTH-001

| Rota                | Acesso                           | Comportamento incompatível                           |
| ------------------- | -------------------------------- | ---------------------------------------------------- |
| `/`                 | entrada Server                   | anônimo → login; pendente → troca; comum → dashboard |
| `/login`            | anônimo                          | pendente → troca; autenticado → dashboard            |
| `/redefinir-senha`  | sessão com troca obrigatória     | anônimo → login; troca concluída → dashboard         |
| `/senha-atualizada` | sessão válida e troca concluída  | anônimo → login; pendente → redefinir senha          |
| `/dashboard`        | ambos os perfis, troca concluída | anônimo → login; pendente → redefinir senha          |

A implementação de `WEB-AUTH-001` criou `/dashboard` protegido, conforme a
[tarefa aprovada](../../tasks/WEB-AUTH-001-integrar-autenticacao.md). O
`WEB-AUTH-003` removeu o catálogo público transitório: `/` consulta a identidade
uma vez por request e aplica a matriz da tabela. Falha transitória da API mostra
estado explícito e não é convertida em logout; `401` continua levando ao login.

`WEB-SHELL-001` moveu `/dashboard` para `app/(sistema)/dashboard` e centralizou
os redirects de sessão em `app/(sistema)/layout.tsx`. A consulta memoizada da
identidade é reutilizada pelas páginas que precisam do perfil, sem nova chamada
HTTP no mesmo request. O catálogo de telas e navegação é a fonte de rota,
label, perfil, item ativo, breadcrumb, rodapé e padrões descendentes. Rotas
dinâmicas mostram labels orientados à tarefa sem expor o identificador técnico;
ancestrais reais são links. A correspondência por segmentos evita colisões como
`/patrimonios/novo` e `/patrimonios/[patrimonioId]`.

`WEB-SHELL-002` removeu Configurações e Histórico da sidebar, manteve Minha
conta no menu do usuário e eliminou o sino e a consulta de notificações. A
extensão implementada padroniza todas as páginas autenticadas com `PageHeader`:
título e descrição à esquerda e ações opcionais à direita. No dashboard, a
saudação ocupa o título e a data ocupa a descrição. `SystemFooter` permanece o
único rodapé de página; os rodapés legados das verticais foram removidos.

`WEB-DASHBOARD-001` adicionou `loading.tsx` ao segmento e integrou os totais
geral e por status por uma operação Server. Erro de integração e zero registros
são estados distintos da página.

Na Web, inventários são apresentados em escopo global, conforme o contrato de
criação: setores ativos e bens ativos são incluídos no momento da abertura. A
conferência e a conclusão continuam no aplicativo móvel. Correções pendentes
podem ser registradas pelo Diretor enquanto o inventário não estiver
finalizado.

## Matriz implementada por WEB-AUTH-002

| Rota                       | Acesso                        | Responsabilidade              |
| -------------------------- | ----------------------------- | ----------------------------- |
| `/esqueci-senha`           | pública                       | solicitar e-mail              |
| `/recuperar-senha#token=…` | pública com token transitório | definir senha                 |
| `/recuperacao-concluida`   | pública, sem dado sensível    | voltar ao app ou ao login Web |

`/recuperar-senha` não é um modo de `/redefinir-senha`: a primeira usa token
de uso único e a segunda continua exigindo sessão com primeiro acesso pendente.
Depois do sucesso, a navegação substitui o histórico para que Voltar não
reexiba o formulário ou o fragmento. Consulte
[WEB-AUTH-002](../../tasks/WEB-AUTH-002-recuperar-senha.md).

## Convenções

- mantenha `page.tsx` e `layout.tsx` como Server Components por padrão;
- use grupos de rota para organização sem alterar a URL;
- valide `params` e `searchParams` antes de passá-los à feature;
- represente filtros e paginação compartilháveis na URL;
- diferencie conteúdo ausente de falha recuperável;
- crie `loading.tsx`, `error.tsx` e `not-found.tsx` quando a rota tiver esses
  estados reais;
- não use intercepting routes apenas para evitar uma página dedicada.

## Metadata

O layout raiz define o template de título e a configuração pública fornece o
nome da aplicação. Cada nova página deve ter `h1` e metadata coerentes, sem
expor identificadores brutos ou dados sensíveis.

## Modais roteáveis

Se uma feature exigir modal roteável, documente a semântica de acesso direto,
refresh, Voltar e Avançar. Preserve foco, teclado e confirmação de descarte. Um
modal não deve ser a única forma de alcançar uma operação essencial.

Na evolução aprovada, criação e edição dos cadastros administrativos e do
inventário pendente usam esse padrão. Cadastro patrimonial, manutenção e ações
patrimoniais complexas permanecem em páginas/drawers próprios. O detalhe
operacional do inventário continua página completa. Consulte
[WEB-CADASTROS-002](../../tasks/WEB-CADASTROS-002-modais-roteaveis.md) e
[WEB-INVENTARIOS-002](../../tasks/WEB-INVENTARIOS-002-edicao-finalizacao.md).

O slot paralelo raiz `@modal` concentra as rotas interceptadas e possui rota
catch-all que desmonta o conteúdo em navegações subsequentes. A composição
compartilhada `RouteModal` mantém título, descrição, foco, Escape e fechamento
sob responsabilidade da navegação; cada feature continua responsável por
permissão, carregamento, formulário, confirmação de descarte e destino após
sucesso. O inventário é o consumidor de referência dessa fundação.

A Etapa 1 de `WEB-CADASTROS-002` removeu a navegação interna que repetia a
sidebar e centralizou os destinos canônicos de lista, criação e edição dos oito
cadastros em `administrativeRoutes`. A Etapa 2 aplicou a estrutura a
fornecedores, setores e responsáveis. Processos de compra, comissões,
naturezas, espécies e usuários continuam pendentes das etapas funcionais
correspondentes; até lá, suas URLs e fluxos permanecem inalterados.
