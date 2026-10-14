# Páginas e roteamento

## Estado da base

A aplicação limpa expõe:

- `/`: home estática e neutra com links para os health checks;
- `/api/health`: health check da camada Web;
- `/api/backend/*`: rewrite interno para a API, não uma página navegável.

Não existem rotas dinâmicas, paralelas ou interceptadas no baseline. O exemplo
completo permanece consultável na tag `exemplo-produto-v1.0.0`.

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
