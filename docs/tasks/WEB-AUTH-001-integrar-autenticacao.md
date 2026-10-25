# `WEB-AUTH-001` — Integrar login, primeiro acesso e sessão Web

**Status:** `aprovada`

## Objetivo

Transformar as interfaces existentes de login, nova senha e confirmação em um
fluxo funcional integrado à API, criar um dashboard mínimo protegido e manter
a home pública com um catálogo das rotas Web e suas permissões.

## Contexto e referências

- Roadmap: [aplicação Web](../apps/web/roadmap.md#web-auth-001--integrar-login-primeiro-acesso-e-sessão);
- Backend dependente: [AUTH-004](./AUTH-004-primeiro-acesso-obrigatorio.md);
- Contratos dependentes: [CONTRACTS-009](./CONTRACTS-009-primeiro-acesso.md);
- Rotas: [páginas e roteamento](../apps/web/pages-and-routing.md);
- Integração: [Web–API](../integrations/web-api/README.md#fluxo-web-de-autenticação-planejado);
- Segurança: [identidade e acesso](../security-and-access.md) e
  [segurança Web](../apps/web/security.md);
- Referência visual: arquivo Figma `YGy7F6OGLf6FhXrVomleGk`, frames desktop
  `Login` (`334:43461`), `Crie sua nova senha` (`315:42521`) e
  `Senha atualizada` (`315:42590`), além dos equivalentes móveis
  (`334:43423`, `315:43371` e o frame `Senha atualizada` da página
  `Telas Mobile`).

## Escopo

- criar operações tipadas para login, `/auth/me`, conclusão do primeiro acesso
  e logout, sempre validando responses que possuem body;
- enviar `X-SIPAT-CSRF: 1` nas mutações e deixar o cookie `HttpOnly` sob
  controle do servidor;
- encaminhar explicitamente o cookie recebido ao consultar `/auth/me` em
  Server Components e usar `cache: "no-store"`;
- manter a menor fronteira Client nos formulários e usar os schemas Zod já
  compartilhados, sem adicionar biblioteca de formulário ou cache remoto;
- implementar estados pending, inválido, indisponível, rate limit e sucesso,
  preservando os valores não sensíveis e sem ecoar senha;
- aplicar os redirects da matriz documentada sem loop;
- criar `/dashboard` mínima, protegida para os dois perfis, identificada como
  futura home autenticada;
- manter `/` sempre pública e listar todas as páginas Web disponíveis com tipo
  de acesso e perfis permitidos; listar endpoints técnicos separadamente;
- usar o brasão em `public/images/brasao.png` nos pontos exibidos no protótipo
  e usar o mesmo asset como ícone válido do App Router;
- cobrir desktop e mobile conforme os frames do Figma, incluindo teclado,
  foco, zoom, conteúdo longo e acessibilidade automatizável;
- adicionar testes unitários e E2E do fluxo e dos redirects.

## Fora do escopo

- tela de recuperação por e-mail e consumo do token do `AUTH-003`;
- gestão de usuários, navegação final do produto ou conteúdo real do dashboard;
- autenticação mobile, MFA, “lembrar de mim” ou estado global;
- usar Proxy do Next.js como validação completa da sessão;
- tornar health checks ou o rewrite do backend páginas de domínio.

## Decisões aprovadas

- fluxo: `/login` → `/redefinir-senha` → `/senha-atualizada` → `/dashboard`
  quando `trocaSenhaObrigatoria` for verdadeiro; caso contrário, login segue
  diretamente para `/dashboard`;
- `/senha-atualizada` exige sessão válida já rotacionada e troca concluída;
- `/dashboard` aceita `ADMINISTRADOR` e `DIRETOR_PATRIMONIO` nesta etapa;
- `/` não redireciona usuários autenticados e permanece um catálogo público;
- Proxy pode fazer apenas prechecagem otimista da presença do cookie; cada
  página protegida confirma a identidade com `/auth/me` perto do dado;
- o botão visual “Esqueci minha senha” não deve permanecer como ação inerte:
  até existir `WEB-AUTH-002`, ele deve ser retirado da interface interativa;
- `/redefinir-senha` atende primeiro acesso neste objetivo. Um consumidor Web
  futuro do token de recuperação deverá definir explicitamente seu modo e não
  inferir autorização pela simples presença de query string;
- erros `401` levam ao login; pendência de primeiro acesso leva à troca;
  `403` por perfil não é tratado como sessão expirada;
- o nome do usuário vem da identidade autenticada; textos de exemplo como
  “Paulo” não permanecem hardcoded.

## Matriz de rotas esperada

| Rota                 | Acesso                            | Redirect principal                         |
| -------------------- | --------------------------------- | ------------------------------------------ |
| `/`                  | pública                           | nenhum                                     |
| `/login`             | pública para anônimo              | sessão pendente → troca; comum → dashboard |
| `/redefinir-senha`   | sessão com troca obrigatória      | anônimo → login; comum → dashboard         |
| `/senha-atualizada`  | sessão válida com troca concluída | anônimo → login; pendente → troca          |
| `/dashboard`         | ambos os perfis, troca concluída  | anônimo → login; pendente → troca          |
| `/api/health`        | pública, endpoint técnico         | não se aplica                              |
| `/api/backend/:path` | transporte interno; segue a API   | não é página navegável                     |

## Critérios de aceite

- [ ] credenciais válidas criam cookie e navegam conforme a pendência;
- [ ] credenciais inválidas, `429` e indisponibilidade possuem feedback
      acessível sem revelar existência da conta;
- [ ] nova senha válida conclui o primeiro acesso e recebe a sessão rotacionada;
- [ ] confirmação abre somente com sessão válida e o botão continua para o
      dashboard;
- [ ] refresh e acesso direto a cada rota obedecem à matriz sem loop;
- [ ] sessão expirada durante formulário ou navegação retorna ao login de forma
      previsível;
- [ ] logout revoga a sessão e volta ao login;
- [ ] home pública lista todas as páginas existentes e suas permissões sem
      consultar dados protegidos;
- [ ] dashboard deixa claro que é a futura home autenticada;
- [ ] nenhuma senha, cookie ou resposta bruta aparece em Client props, URL,
      storage, log ou métrica;
- [ ] brasão e ícone possuem arquivo não vazio, formato coerente e geometria
      compatível com desktop e mobile;
- [ ] lint, typecheck, testes, build, Playwright e inspeção visual passam.

## Arquivos ou módulos potencialmente afetados

- `apps/web/app/(auth)/`;
- novas rotas `apps/web/app/dashboard/` e, se adotado, grupo protegido;
- `apps/web/app/page.tsx` e `apps/web/app/page.module.css`;
- `apps/web/lib/api/` e nova feature/operações de autenticação;
- eventual `apps/web/proxy.ts` limitado à prechecagem otimista;
- catálogo de rotas em módulo compartilhado da Web;
- `apps/web/public/images/brasao.png` e `apps/web/app/icon.png`;
- testes Vitest e `apps/web/e2e/`.

## Verificações esperadas

- `pnpm --filter @repo/web lint`;
- `pnpm --filter @repo/web typecheck`;
- `pnpm --filter @repo/web test`;
- `pnpm --filter @repo/web build`;
- `pnpm --filter @repo/web test:e2e` com API mockada para cada estado;
- E2E Web–API real para cookie, CSRF, rotação e redirects;
- inspeção manual desktop 1920×1080 e mobile 390×844, além de viewport
  intermediária e zoom de 200%;
- `pnpm format:check`.

## Pendências ou decisões bloqueantes

- Nenhuma para este objetivo. A recuperação de senha Web permanece em objetivo
  separado e não pode ser habilitada parcialmente.
