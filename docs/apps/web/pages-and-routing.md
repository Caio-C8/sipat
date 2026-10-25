# Páginas e roteamento

## Estado atual

A aplicação Web do SIPAT expõe:

- `/`: home estática e neutra com links para os health checks;
- `/login`: interface visual sem integração;
- `/redefinir-senha`: interface visual do primeiro acesso sem integração;
- `/senha-atualizada`: interface visual de confirmação sem integração;
- `/api/health`: health check da camada Web;
- `/api/backend/*`: rewrite interno para a API, não uma página navegável.

Ainda não existem rotas de domínio funcionais, dinâmicas, paralelas ou
interceptadas. `/dashboard` ainda não existe.

## Matriz aprovada para WEB-AUTH-001

| Rota                | Acesso                           | Comportamento incompatível                   |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `/`                 | pública                          | permanece pública, inclusive autenticado     |
| `/login`            | anônimo                          | pendente → troca; autenticado → dashboard    |
| `/redefinir-senha`  | sessão com troca obrigatória     | anônimo → login; troca concluída → dashboard |
| `/senha-atualizada` | sessão válida e troca concluída  | anônimo → login; pendente → redefinir senha  |
| `/dashboard`        | ambos os perfis, troca concluída | anônimo → login; pendente → redefinir senha  |

A home deverá listar todas as páginas realmente disponíveis e seus acessos. Os
endpoints `/api/health` e `/api/backend/:path*` aparecem em uma seção técnica,
deixando explícito que o rewrite herda a política da API e não é uma página.

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
