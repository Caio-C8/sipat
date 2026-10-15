# Segurança da API

## Objetivo

Este diretório define como segurança deve participar do desenho, da
implementação e da revisão da API. Segurança não é uma etapa executada somente
depois que as rotas estão prontas.

Os documentos estabelecem critérios reutilizáveis, mas não escolhem
antecipadamente JWT, sessão, provedor de identidade, modelo de permissões ou
valores de limites. Essas decisões dependem do produto e devem ser documentadas
quando forem tomadas.

## Princípios obrigatórios

- negar acesso por padrão quando a política de autenticação permitir;
- validar todo dado externo no boundary apropriado;
- autorizar a operação e também o recurso acessado;
- retornar somente propriedades previstas no contrato de response;
- aplicar menor privilégio a usuários, serviços e credenciais;
- manter credenciais de autenticação do navegador em cookies `HttpOnly`;
- não registrar secrets, credenciais ou dados pessoais desnecessários;
- limitar consumo de recursos proporcionalmente ao risco da operação;
- tratar integrações externas como entradas não confiáveis;
- falhar de forma segura sem revelar detalhes internos;
- cobrir controles relevantes com testes automatizados.

Esses princípios estão alinhados aos riscos do
[OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/),
especialmente autorização por objeto e propriedade, autenticação, consumo de
recursos, configuração e consumo de APIs externas.

## Documentos

| Assunto                                 | Documento                                                |
| --------------------------------------- | -------------------------------------------------------- |
| Controles aplicados à aplicação inteira | [Baseline](./baseline.md)                                |
| Identidade, credenciais e strategies    | [Autenticação](./authentication.md)                      |
| Permissões, ownership e políticas       | [Autorização](./authorization.md)                        |
| Entrada, saída, arquivos e integrações  | [Input e output](./input-and-output.md)                  |
| HTTP, abuso e disponibilidade           | [Proteção HTTP](./http-protection.md)                    |
| Secrets, logs, criptografia e erros     | [Secrets, logs e erros](./secrets-logging-and-errors.md) |
| Matriz de rotas e verificações          | [Testes de segurança](./testing.md)                      |

O funcionamento de Guards, Interceptors, Filters, Middleware e Pipes está em
[Ciclo da requisição](../request-lifecycle/README.md).

## Onde o código deve ficar

| Componente                              | Local inicial                    |
| --------------------------------------- | -------------------------------- |
| Autenticação e strategies               | `apps/api/src/modules/auth`      |
| Controle compartilhado por toda a API   | `apps/api/src/common`            |
| Controle exclusivo de um domínio        | `apps/api/src/modules/<dominio>` |
| Contrato compartilhado com consumidores | `packages/contracts`             |

Não crie diretórios vazios antecipadamente. Adicione `guards`,
`interceptors`, `filters`, `middleware`, `pipes` ou `strategies` quando existir
uma responsabilidade concreta.

## Segurança em três momentos

1. **Baseline:** configure controles globais antes dos módulos de domínio.
2. **Feature:** defina acesso, exposição e abuso enquanto cada rota é criada.
3. **Revisão:** procure falhas de composição e regressões antes da entrega.

A revisão final complementa o desenho seguro; não o substitui.
