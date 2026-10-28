# Páginas e roteamento

## Estado atual

A aplicação Web do SIPAT expõe:

- `/`: catálogo público das páginas, acessos e endpoints técnicos;
- `/login`: autenticação integrada à API para usuários anônimos;
- `/redefinir-senha`: conclusão protegida do primeiro acesso;
- `/senha-atualizada`: confirmação protegida após a troca;
- `/dashboard`: visão geral protegida com totais patrimoniais para os dois
  perfis;
- `/movimentacoes` e `/movimentacoes/[movimentacaoId]`: consulta para ambos os perfis;
- `/movimentacoes/nova`: registro em três etapas somente pelo diretor;
- `/api/health`: health check da camada Web;
- `/api/backend/*`: rewrite interno para a API, não uma página navegável.

As páginas de autenticação e o layout do grupo `(sistema)` validam a identidade
pelo endpoint `/auth/me` nas fronteiras Server. O grupo não altera a URL e
compartilha o shell das páginas autenticadas; formulários, menus e logout ficam
em pequenas fronteiras Client. O dashboard faz leituras paralelas no servidor;
movimentações acrescenta consulta/detalhe Server e formulário Client integrado.

## Matriz aprovada para WEB-AUTH-001

| Rota                | Acesso                           | Comportamento incompatível                   |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `/`                 | pública                          | permanece pública, inclusive autenticado     |
| `/login`            | anônimo                          | pendente → troca; autenticado → dashboard    |
| `/redefinir-senha`  | sessão com troca obrigatória     | anônimo → login; troca concluída → dashboard |
| `/senha-atualizada` | sessão válida e troca concluída  | anônimo → login; pendente → redefinir senha  |
| `/dashboard`        | ambos os perfis, troca concluída | anônimo → login; pendente → redefinir senha  |

A implementação de `WEB-AUTH-001` substituiu a visão geral ilustrativa em `/`
pelo catálogo público e criou `/dashboard` protegido, conforme a
[tarefa aprovada](../../tasks/WEB-AUTH-001-integrar-autenticacao.md). O catálogo
lista todas as páginas realmente disponíveis e seus acessos. Os
endpoints `/api/health` e `/api/backend/:path*` aparecem em uma seção técnica,
deixando explícito que o rewrite herda a política da API e não é uma página.

`WEB-SHELL-001` moveu `/dashboard` para `app/(sistema)/dashboard` e centralizou
os redirects de sessão em `app/(sistema)/layout.tsx`. O catálogo de navegação é
a fonte do item ativo e do breadcrumb; somente caminhos Web implementados
recebem link. Movimentações está marcado como implementado e inclui suas páginas descendentes no item ativo e breadcrumb.

`WEB-DASHBOARD-001` adicionou `loading.tsx` ao segmento e integrou os totais
geral e por status por uma operação Server. Erro de integração e zero registros
são estados distintos da página.

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
