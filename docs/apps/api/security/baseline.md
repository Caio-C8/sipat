# Baseline de segurança

## Finalidade

O baseline reúne controles que normalmente pertencem à aplicação inteira. O
SIPAT deve decidir quais se aplicam, configurar valores por ambiente e registrar
exceções justificadas.

O estado atual não possui rotas de domínio, login, usuários, sessão,
autenticação, autorização ou CSRF. Os controles de identidade descritos neste
documento não estão implementados; devem ser aplicados e testados quando o SIPAT
introduzir identidade ou dados protegidos.

A API restringe origens por `CORS_ORIGINS`, mantém `credentials: false`, limita
métodos e headers e expõe somente `X-Request-Id`. Essa política protege a
fronteira atual, mas não substitui autenticação ou autorização quando surgirem
rotas de domínio.

## Inicialização e configuração

Antes de aceitar requisições:

- valide variáveis de ambiente obrigatórias e seus formatos;
- interrompa a inicialização quando uma configuração de segurança estiver
  ausente ou inválida;
- não mantenha credenciais reais em arquivos versionados;
- configure origem, headers, métodos e credenciais do CORS explicitamente;
- registre headers de segurança antes das rotas;
- defina limites de body, upload, timeout e consumo de recursos;
- configure corretamente proxies confiáveis antes de depender do IP do cliente;
- habilite logs sem expor dados sensíveis.

O NestJS recomenda validar configurações na inicialização e documenta que
middlewares como Helmet e CORS precisam ser registrados antes das rotas para
abrangê-las.

## Componentes globais

Avalie o registro global de:

- Pipe de validação;
- Guard de autenticação padrão;
- Guard de rate limiting;
- Middleware para criar e propagar o contexto inicial de correlação;
- Interceptor para consumir esse contexto em métricas e tracing, quando
  necessário;
- Exception Filter para o contrato público de erros.

Use providers `APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER` e `APP_PIPE` quando o
componente precisar de injeção de dependência. A escolha entre registro global,
controller e rota deve ser explícita e coberta por testes.

## Política padrão de acesso

Quando a maioria das rotas for protegida, prefira autenticação global e uma
exceção explícita para rotas públicas. Um decorator de rota pública apenas
declara metadados; o Guard continua responsável por interpretá-los e aplicar a
política.

Não adote esse desenho sem definir:

- quais rotas podem ser públicas;
- como a identidade é representada;
- como credenciais são transportadas;
- qual comportamento produz `401` e qual produz `403`;
- como revogação, expiração e rotação funcionam.

## Checklist do baseline

- [ ] configuração validada ao iniciar;
- [ ] política de autenticação definida;
- [ ] credenciais de navegador usam cookie `HttpOnly` e não Web Storage;
- [ ] `Secure`, `SameSite`, escopo, expiração, renovação e logout definidos;
- [ ] resposta pública de erros definida;
- [ ] CORS restrito aos consumidores esperados;
- [ ] necessidade de CSRF avaliada conforme o transporte de credenciais;
- [ ] headers HTTP de segurança configurados;
- [ ] rate limiting e limites de payload definidos;
- [ ] logs e tracing não expõem secrets;
- [ ] testes E2E confirmam a ordem e a abrangência dos controles globais.

Um item pode ser marcado como não aplicável somente com uma justificativa
registrada.
