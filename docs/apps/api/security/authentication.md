# Autenticação

> A decisão específica do SIPAT por sessão opaca revogável, cookie `HttpOnly`
> e proteção CSRF está em
> [Identidade, sessão e controle de acesso](../../../security-and-access.md).
> A validação de sessões do `SEC-001`, login, logout, `/auth/me`, emissão do
> cookie e criação produtiva de sessões do `AUTH-001` e alteração autenticada
> da própria senha do `AUTH-002` estão implementados. A integração Web
> permanece no objetivo Web próprio.

## Responsabilidade

Autenticação estabelece quem ou qual sistema fez a requisição. Ela não decide,
sozinha, se a identidade pode executar uma ação sobre determinado recurso.

Antes de implementar, defina:

- tipo de cliente: navegador, mobile, serviço ou combinação;
- mecanismo: sessão, bearer token, provedor externo ou outro;
- transporte e armazenamento das credenciais;
- expiração, renovação, revogação e rotação;
- proteção contra força bruta e enumeração de contas;
- formato mínimo da identidade anexada à requisição.

Não escolha JWT ou Passport apenas porque aparecem em um exemplo do framework.

## Credenciais de autenticação em navegadores

Quando o consumidor for um navegador, toda credencial que autentica o usuário,
incluindo identificador de sessão, access token ou refresh token, deve ficar em
cookie `HttpOnly`. Não armazene essas credenciais em `localStorage`,
`sessionStorage`, estado persistido do React ou qualquer mecanismo legível por
JavaScript.

O servidor responsável pela sessão deve criar, renovar e expirar o cookie. Como
baseline, defina explicitamente:

- `HttpOnly` em todos os ambientes;
- `Secure` em homologação e produção, sempre sob HTTPS;
- `SameSite=Strict` quando o fluxo permitir ou `SameSite=Lax` quando navegações
  externas legítimas precisarem preservar a sessão;
- `SameSite=None` somente quando a topologia realmente exigir contexto
  cross-site, sempre junto de `Secure` e proteção CSRF explícita;
- `Path` com o menor escopo compatível, usando `/` quando a sessão atende toda a
  aplicação;
- ausência de `Domain` quando não houver compartilhamento entre subdomínios;
- expiração curta e políticas de renovação, revogação, rotação e logout;
- prefixo `__Host-` quando forem atendidos `Secure`, `Path=/` e ausência de
  `Domain`.

`HttpOnly` protege a confidencialidade da credencial contra leitura por scripts,
mas não impede o navegador de enviá-la nem bloqueia ações autenticadas causadas
por XSS ou CSRF. Cookies de autenticação exigem uma política CSRF compatível,
além de proteção contra XSS, CORS restrito e validação de origem quando
aplicável.

A regra não torna todo cookie obrigatoriamente `HttpOnly`. Um cookie de
preferência ou um token CSRF que precise ser copiado pelo JavaScript para um
header pode ser legível, desde que nunca funcione como credencial de
autenticação e tenha escopo e integridade definidos. A credencial de sessão
permanece `HttpOnly`.

Para mobile nativo ou comunicação entre serviços, documente armazenamento e
transporte próprios do runtime; não replique automaticamente a política de
cookies do navegador.

Consulte as recomendações de
[gerenciamento de sessão da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
e de
[prevenção de CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## Módulo de autenticação

Quando houver autenticação, mantenha-a como domínio explícito:

```text
apps/api/src/modules/auth/
├── decorators/
├── dtos/
├── guards/
├── strategies/
├── auth.controller.ts
├── auth.module.ts
└── auth.service.ts
```

Crie somente os diretórios utilizados. O módulo pode depender do service que
representa identidades, mas deve respeitar os limites entre domínios.

## Strategies

Strategies são adaptadores de um mecanismo de autenticação. Se Passport for a
solução escolhida, uma strategy deve:

- extrair a credencial no formato configurado;
- verificar sua validade por meio do service apropriado;
- produzir uma identidade mínima e tipada;
- rejeitar credenciais inválidas sem revelar detalhes sensíveis.

O Guard aciona a strategy e decide se a rota pode continuar. Não coloque regras
de negócio extensas, montagem de response ou emissão de credenciais dentro da
strategy.

A integração com Passport é opcional e deve seguir a
[receita oficial do NestJS](https://docs.nestjs.com/recipes/passport) caso seja
adotada.

## Credenciais e respostas

- nunca registre senha, token, cookie ou header de autorização;
- compare secrets e senhas com mecanismos apropriados, não como texto puro;
- não retorne hashes ou informações internas da identidade;
- evite respostas diferentes que permitam enumerar contas sem necessidade;
- mantenha chaves e secrets fora do código e permita rotação;
- documente como web, mobile e outros clientes enviam e renovam credenciais em
  [Integrações](../../../integrations/README.md).

## Status HTTP

Como regra geral:

- `401 Unauthorized`: identidade ausente ou autenticação inválida;
- `403 Forbidden`: identidade reconhecida, mas sem permissão.

O contrato público de erro deve permanecer estável e não revelar o motivo
interno além do necessário.
