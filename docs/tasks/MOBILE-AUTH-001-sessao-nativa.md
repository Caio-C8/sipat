# `MOBILE-AUTH-001` — Implementar sessão nativa revogável

**Status:** `em validação`

## Objetivo

Adicionar contratos e backend para autenticação Android/iOS com access token
opaco curto e refresh token opaco rotativo, preservando as políticas atuais de
sessão, primeiro acesso e autorização sem alterar o fluxo por cookie da Web.

## Contexto e referências

- Roadmap: [aplicativo mobile](../apps/mobile/roadmap.md#primeira-entrega-autenticada).
- Segurança: [identidade e acesso](../security-and-access.md#sessão-do-aplicativo-mobile-aprovada)
  e [segurança mobile](../apps/mobile/security.md#sessão-e-armazenamento).
- Integração: [autenticação e armazenamento](../integrations/mobile-api/auth-storage.md)
  e [clientes e operações](../integrations/mobile-api/clients-and-operations.md#operações-de-autenticação-aprovadas).
- Dependências implementadas: `AUTH-001`, `AUTH-004` e `CONTRACTS-009`.
- Referências externas: [Expo SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/),
  [RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700) e
  [OWASP Mobile](https://mas.owasp.org/MASTG/0x04e-Testing-Authentication-and-Session-Management/).

## Escopo

- definir em `@repo/contracts` requests e responses estritas para login,
  refresh, identidade, conclusão do primeiro acesso e logout nativos;
- criar endpoints sob `/api/auth/mobile` sem mudar o contrato dos endpoints Web;
- emitir access token opaco de 32 bytes aleatórios, Base64url sem padding, com
  dez minutos de validade e somente seu hash persistido;
- emitir refresh token opaco com a mesma entropia, persistir somente o hash e
  rotacioná-lo atomicamente em todo refresh;
- manter por sessão lógica oito horas absolutas, trinta minutos nominais de
  inatividade e o limite global atual de cinco sessões ativas por usuário;
- detectar reutilização de refresh token rotacionado e revogar a família;
- aceitar access Bearer nas rotas protegidas, sempre consultando sessão, usuário
  ativo, perfil atual e `trocaSenhaObrigatoria` no servidor;
- usar refresh Bearer somente nos endpoints de refresh e logout;
- recusar request que apresente simultaneamente cookie de sessão e Bearer;
- manter cookie, Origin e CSRF atuais para a Web; isentar de CSRF somente o
  transporte Bearer e os endpoints nativos explicitamente declarados;
- aplicar ao login nativo o mesmo limite persistido e capacidade Argon2 do
  login Web, com chave de escopo própria e resposta pública equivalente;
- no primeiro acesso, trocar a senha e a família restrita por uma família comum
  somente após commit, retornando identidade e novo par;
- revogar a família no logout e em inativação, alteração ou redefinição de
  senha, sem deixar credencial anterior reutilizável;
- enviar `Cache-Control: no-store` nas responses que contenham tokens e excluir
  credenciais de logs, métricas, exceptions e serialização genérica;
- atualizar documentação de API, segurança e contratos somente após verificar
  o comportamento implementado.

## Fora do escopo

- JWT, OAuth/OIDC, PKCE ou provedor externo de identidade;
- MFA, biometria, DPoP, attestation, pinning ou detecção de root/jailbreak;
- aumentar as oito horas, os trinta minutos ou as cinco sessões;
- autenticação do React Native Web por Bearer persistido;
- telas e armazenamento no aplicativo, entregues em `MOBILE-AUTH-002`;
- cache de domínio, fila offline ou renovação em background sem consumidor.

## Decisões aprovadas

- access token dura dez minutos e fica apenas em memória no aplicativo;
- refresh token fica no `expo-secure-store` e nunca no AsyncStorage;
- refresh não estende o limite absoluto contado do login original;
- atividade válida segue a mesma persistência condicional já usada pela sessão
  Web e nunca amplia a janela nominal além de trinta minutos;
- uma família mobile conta como uma das cinco sessões ativas do usuário;
- o token continua opaco e revogável; perfil ou autorização não são confiados a
  claims controladas pelo cliente;
- reutilização de refresh é tratada como possível comprometimento da família;
- erros não distinguem conta inexistente, inativa ou senha incorreta;
- rotas de domínio continuam privadas por padrão e a API continua autoridade.

## Contrato HTTP esperado

| Método e path                                    | Autenticação           | Resultado principal                        |
| ------------------------------------------------ | ---------------------- | ------------------------------------------ |
| `POST /api/auth/mobile/login`                    | pública nativa         | identidade + access + refresh + expirações |
| `POST /api/auth/mobile/refresh`                  | refresh Bearer         | novo access + novo refresh + expirações    |
| `GET /api/auth/mobile/me`                        | access Bearer          | identidade segura                          |
| `POST /api/auth/mobile/concluir-primeiro-acesso` | access Bearer restrito | identidade comum + novo par                |
| `POST /api/auth/mobile/logout`                   | refresh Bearer         | `204`, família revogada                    |

Os nomes finais dos campos e códigos públicos devem ser fechados primeiro nos
schemas. Tokens nunca entram em URL, cookie, query ou response de erro.

## Critérios de aceite

- [ ] login válido cria uma família mobile e não cria nem altera cookie Web;
- [ ] login inválido, saturação e rate limit mantêm resposta genérica e custo
      controlado;
- [ ] access expirado não autentica; refresh válido produz exatamente um novo
      par e invalida o refresh anterior;
- [ ] reutilização do refresh anterior revoga a família ativa de forma atômica;
- [ ] concorrência de refresh permite no máximo um vencedor;
- [ ] duração absoluta, inatividade e limite de sessões valem em conjunto para
      Web e mobile sem regressão do comportamento atual;
- [ ] cookie + Bearer é rejeitado e Bearer inválido não faz fallback para
      identidade parcial;
- [ ] sessão com troca obrigatória acessa somente identidade, conclusão e
      logout; demais rotas protegidas mantêm o erro público estável;
- [ ] conclusão do primeiro acesso invalida a família restrita e devolve uma
      família comum somente depois do commit;
- [ ] logout, inativação e mudanças de senha revogam a família aplicável;
- [ ] responses e observabilidade não expõem token, hash, senha, e-mail, ID ou
      header de autorização;
- [ ] todos os endpoints Web e seus testes continuam inalterados funcionalmente;
- [ ] migration, contratos, API, segurança e concorrência possuem cobertura
      automatizada proporcional.

## Arquivos ou módulos potencialmente afetados

- `packages/contracts/src/auth/` e seus testes/exports;
- `packages/database/prisma/schema.prisma` e nova migration;
- `apps/api/src/modules/auth/`, especialmente controller, service,
  repositories, Guards, decorators e testes;
- `apps/api/src/configurar-cors.ts` somente se o contrato explícito exigir;
- documentação de contratos, API e segurança afetada.

Confirme os caminhos no worktree antes de editar e preserve as estruturas Web
existentes.

## Verificações esperadas

- lint, typecheck e testes de `@repo/contracts`;
- geração, lint e typecheck de `@repo/database`;
- testes unitários, E2E, PostgreSQL, lint, typecheck e build de `@repo/api`;
- regressão dos fluxos Web de cookie, CSRF, login, primeiro acesso e logout;
- testes de concorrência de refresh, replay, expiração, inatividade e limite de
  sessões;
- `pnpm --filter @repo/mobile typecheck` como consumidor dos contratos;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente. O desenho físico das tabelas deve ser o
  menor que prove rotação e replay sem enfraquecer a política aprovada.
