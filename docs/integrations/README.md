# Integrações entre aplicações

Este diretório documenta fluxos, acordos e dependências que atravessam duas ou
mais unidades do monorepo.

## Integrações atuais

- [Aplicação web e API](./web-api/README.md).

Quando um app mobile, worker ou novo frontend for adicionado, crie documentação
própria para sua integração. Não presuma que transporte, cache ou autenticação
do navegador sejam adequados a outro runtime.

## Limite

Registre aqui:

- responsabilidades de cada lado;
- protocolo, endpoints e configuração por ambiente;
- autenticação e propagação de identidade;
- contratos, serialização e erros;
- compatibilidade e versionamento;
- timeout, retry, cache e invalidação;
- tratamento de falhas;
- observabilidade e testes integrados.

Limites, métricas e comportamento sob carga seguem o
[baseline de performance](../performance/contracts-and-integrations.md).

Não duplique detalhes internos de página, controller, service ou repository.
Esses assuntos permanecem na documentação de cada app.

## Segurança entre aplicações

Cada integração deve definir:

- como identidade e credenciais são transportadas;
- onde tokens ou cookies podem existir;
- origens CORS e uso de credentials;
- necessidade e fluxo de proteção CSRF;
- renovação, expiração, revogação e logout;
- propagação de correlation ID;
- campos sensíveis que não atravessam a fronteira;
- comportamento diante de `401`, `403`, `429` e indisponibilidade;
- limites e timeouts;
- cache público ou privado.

Para navegadores, credenciais de autenticação devem usar cookies `HttpOnly` e
não podem ser armazenadas em Web Storage. A integração ainda precisa definir
quem emite e encaminha o cookie, seus demais atributos e a proteção CSRF. Outros
runtimes, como mobile nativo e comunicação entre serviços, exigem política
própria.

A implementação dos controles internos da API continua em
[Segurança da API](../apps/api/security/README.md). A segurança de renderização
e do navegador fica em [Segurança web](../apps/web/security.md). Formatos
compartilhados permanecem em [Contratos](../contracts/README.md).
