# `AUTH-003` — Recuperar a senha por e-mail institucional

**Status:** aprovada

## Objetivo

Implementar no backend a solicitação e a confirmação de redefinição da própria
senha por link enviado ao e-mail institucional cadastrado, com response neutra,
token de uso único e revogação de sessões.

## Contexto e referências

- Roadmap: [AUTH-003](../roadmap.md#auth-003--recuperar-a-senha-por-e-mail-institucional).
- Dependências: [CONTRACTS-003](./CONTRACTS-003-contratos-senha.md) e
  [AUTH-002](./AUTH-002-alterar-propria-senha.md) concluídos e verificados.
- Requisitos e decisões: [RF01 e UC01](../requisitos-SIPAT.md#rf01-autenticação-e-controle-de-acesso)
  e [recuperação de senha](../security-and-access.md#recuperação-da-senha-por-e-mail-institucional).
- API: [índice](../apps/api/README.md),
  [autenticação](../apps/api/security/authentication.md),
  [proteção HTTP](../apps/api/security/http-protection.md),
  [segredos e logs](../apps/api/security/secrets-logging-and-errors.md),
  [testes](../apps/api/security/testing.md) e
  [workflow](../apps/api/workflow-and-testing.md).
- Fontes: [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html),
  [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) e
  [Nodemailer SMTP](https://nodemailer.com/smtp).

## Ordem de execução

1. Confirmar branch, worktree, contratos concluídos, `AUTH-002`, módulo `auth`,
   schema Prisma e variáveis existentes.
2. Adicionar a dependência SMTP na versão estável compatível com o Node do
   projeto e validar sua documentação oficial.
3. Acrescentar e validar as configurações de recuperação e SMTP, mantendo a
   recuperação desabilitada quando não houver consumidor HTTPS configurado.
4. Criar migration e models de redefinição e limite de operações de senha;
   gerar o Prisma Client e validar a migration em banco descartável.
5. Implementar geração/hash do token, repository e transações, sem ainda
   expor o token em response ou logs.
6. Implementar a porta de envio, o adapter SMTP e o despachante interno finito;
   usar fake determinístico nos testes.
7. Implementar service, DTOs e as duas rotas públicas no `AuthController`.
8. Integrar `AUTH-002` para invalidar a redefinição pendente quando a senha for
   alterada pelo fluxo autenticado.
9. Cobrir unidades, integração PostgreSQL e E2E com Guards e CSRF reais.
10. Executar lint, tipos, testes, build e verificações transversais.
11. Atualizar documentação de estado e status somente após todas as evidências.

## Escopo

- `POST /api/auth/forgot-password`:
  - recebe somente o contrato de e-mail;
  - retorna `202` com mensagem neutra para conta ativa, inexistente ou inativa;
  - não altera nem bloqueia a conta;
  - cria ou substitui a redefinição somente para usuário ativo;
  - aplica limite persistente por HMAC do e-mail normalizado;
  - despacha a mensagem sem aguardar SMTP na response.
- `POST /api/auth/reset-password`:
  - recebe somente token, nova senha e confirmação;
  - determina o usuário exclusivamente pelo hash do token;
  - usa a mesma falha pública para token inválido, expirado, consumido ou de
    usuário inativo;
  - retorna `204` em sucesso e não cria sessão.
- token de 32 bytes gerado por CSPRNG, Base64url sem padding e SHA-256
  hexadecimal persistido.
- validade de 15 minutos e apenas um registro corrente por usuário.
- consumo condicional e concorrente seguro.
- em sucesso, alteração da senha, consumo/invalidação da redefinição e
  revogação de todas as sessões na mesma transação.
- invalidação da redefinição pendente na transação de alteração autenticada do
  `AUTH-002`.
- mensagem posterior de alteração sem senha, token ou link novo.
- SMTP configurável por ambiente com TLS obrigatório em staging/produção,
  certificado validado, logger/debug desabilitados e um destinatário por envio.
- despachante em memória com fila e concorrência finitas; falha de processo ou
  envio não é recuperada por broker nesta versão e exige nova solicitação.
- flag operacional que mantenha a recuperação indisponível até existir URL
  HTTPS válida para o futuro consumidor.

## Fora do escopo

- página, formulário, operação, hook, redirect ou teste de interface Web;
- qualquer alteração no aplicativo mobile;
- ativação produtiva antes de existir consumidor HTTPS do link;
- verificação adicional dos e-mails institucionais;
- MFA, SMS, perguntas de segurança, códigos offline ou recuperação assistida;
- alteração de senha por administrador;
- broker, outbox durável ou retry persistente de e-mail;
- login automático após a redefinição.

## Decisões aprovadas

- Todos os e-mails cadastrados são institucionais e confiáveis nesta etapa.
- O e-mail nunca seleciona a conta na confirmação; somente o token válido faz
  essa associação.
- Um novo pedido substitui o token anterior do usuário.
- O link é construído por URL configurada, nunca pelo header `Host`.
- As janelas do limite são as do login, com contadores separados por operação.
- Conta inativa não recebe mensagem e não pode usar token emitido antes da
  inativação.
- Falha de SMTP não altera a resposta pública nem desfaz a senha já redefinida;
  somente a notificação posterior pode falhar.
- Segredos SMTP, senha, token e destinatário não entram em logs ou métricas.

## Critérios de aceite

- [ ] responses de solicitação não permitem enumerar conta ou situação;
- [ ] limite é aplicado também a e-mails inexistentes;
- [ ] banco armazena somente o hash do token;
- [ ] token anterior, expirado, consumido ou concorrente não redefine senha;
- [ ] usuário inativo não recebe nem conclui recuperação;
- [ ] sucesso revoga todas as sessões e exige novo login;
- [ ] alteração autenticada posterior à emissão invalida o token pendente;
- [ ] CSRF e Origin continuam obrigatórios nas duas rotas públicas;
- [ ] saturação do despachante e falha SMTP são finitas e observáveis sem dados
      sensíveis;
- [ ] configuração insegura de TLS é rejeitada em staging/produção;
- [ ] nenhum endpoint administrativo de senha é criado;
- [ ] nenhum arquivo de Web ou mobile é alterado.

## Arquivos ou módulos potencialmente afetados

- `packages/database/prisma/schema.prisma` e nova migration;
- `apps/api/package.json`, `pnpm-lock.yaml` e configuração permitida de build,
  se exigida pela dependência;
- `apps/api/src/environment.ts` e seus testes;
- `apps/api/src/modules/auth/`;
- infraestrutura de e-mail em `apps/api/src/common/` somente se reutilizável
  por mais de um domínio; caso contrário, mantê-la no módulo `auth`;
- `apps/api/test/auth.e2e-spec.ts` e testes de integração PostgreSQL;
- documentação de estado e roadmaps afetados, somente após verificação.

## Verificações esperadas

- geração e validação da migration Prisma em PostgreSQL descartável;
- `corepack pnpm --filter @repo/database lint`;
- `corepack pnpm --filter @repo/database typecheck`;
- `corepack pnpm --filter @repo/api lint`;
- `corepack pnpm --filter @repo/api typecheck`;
- `corepack pnpm --filter @repo/api test`;
- `corepack pnpm --filter @repo/api build`;
- testes de contratos e consumidores afetados;
- validação de SMTP com fake; não enviar e-mail real na suíte;
- `corepack pnpm format:check`;
- `git diff --check`.

## Pendências ou decisões bloqueantes

- Para ativar a recuperação fora dos testes, a implantação precisa fornecer
  servidor SMTP institucional, remetente e URL HTTPS do futuro consumidor. A
  ausência desses valores não bloqueia a implementação backend, mas bloqueia a
  ativação operacional do fluxo.
