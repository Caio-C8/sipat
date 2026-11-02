# Integração entre Web e API

Este diretório documenta os acordos e a infraestrutura que conectam
`apps/web` e `apps/api`.

## Escopo

Aqui ficam:

- clientes HTTP padronizados;
- diferença entre execução no navegador e no servidor;
- funções que representam operações HTTP;
- contratos de request e response;
- erros, cancelamento, cache e invalidação;
- autenticação, cookies `HttpOnly`, CSRF e observabilidade;
- testes da fronteira.

Construção visual fica em [Aplicação Web](../../apps/web/README.md). Detalhes de
controllers, services e repositories ficam em [API](../../apps/api/README.md).

## Estado atual

No estado atual:

- o Next.js encaminha `/api/backend/:path*` para
  `${API_INTERNAL_URL}/api/:path*`;
- o navegador pode usar a origem relativa `/api/backend` sem conhecer a URL
  interna da API;
- `@repo/contracts` é compartilhado entre Web e API;
- existem clientes HTTP centrais separados para navegador e servidor;
- `createApiClient` usa `fetch` nativo, timeout, cancelamento, serialização JSON ou `FormData`,
  validação de responses, normalização de erros e `204 No Content`;
- respostas de erro são validadas com `RespostaErroSchema`;
- operações HTTP podem emitir métricas normalizadas sem paths, payloads,
  credenciais ou identificadores;
- existem operações tipadas de autenticação, patrimônio, movimentações e manutenções;
  movimentações usa hooks específicos por operação, estado local e URL, sem cache remoto;
- os contratos e endpoints administrativos de usuários estão implementados no
  backend, mas ainda não possuem consumidor Web;
- login, logout, `/auth/me` e conclusão do primeiro acesso possuem consumidor
  Web; mutações enviam o sinal de CSRF e o cookie permanece `HttpOnly` sob
  controle da API;
- alteração e recuperação de senha estão planejadas somente para contratos,
  banco e API em `CONTRACTS-003`, `AUTH-002` e `AUTH-003`; páginas, operações e
  hooks Web permanecem fora dessas entregas.

A integração básica pode ser verificada por `GET /api/backend/health`. As
operações e os hooks Web de usuários ainda não existem.

O dashboard usa o cliente Server para cinco consultas paralelas e finitas a
`GET /patrimonios`: uma geral e quatro filtradas por status, todas com
`pagina=1`, `limite=1`, cache desabilitado e cookie encaminhado explicitamente.
Somente `meta.total` alimenta a interface; a Web não percorre páginas para
calcular agregados ausentes.

O cadastro em `/patrimonios/novo` usa o cliente do navegador para consultar
`GET /especies`, `GET /setores?ativo=true` e `GET /processos-compra`, carregando
todas as páginas válidas (limite 50). A natureza vem da espécie selecionada e
o responsável vem do setor selecionado. A criação usa `POST /patrimonios`, o
schema compartilhado e o sinal CSRF; a chave e o payload são preservados na
sessão quando o resultado da operação fica incerto. Processo de compra é
opcional conforme o contrato atual.

Em manutenção, a listagem e o detalhe usam operações Server com cookie
encaminhado por requisição e cache desabilitado. Criação, orçamento, retorno e
upload usam operações do navegador com CSRF; `FormData` deixa o navegador
definir o boundary do multipart. Após sucesso, o detalhe consulta novamente a
API. Nenhuma mutação recebe retry automático. O percurso Web → API →
PostgreSQL descartável está registrado em
[WEB-MANUTENCOES-001](../../tasks/WEB-MANUTENCOES-001-interface-manutencoes.md).

Em empréstimos, lista e detalhe usam operações Server; opções e mutações usam
as operações tipadas do navegador. As confirmações enviam CSRF e conservam a
chave de idempotência no reenvio do mesmo formulário. Após saída, a seleção
de bens é atualizada; após devolução, o detalhe recebe o resultado real e
atualiza a leitura Server. O percurso Web → API → PostgreSQL isolado está em
[WEB-EMPRESTIMOS-001](../../tasks/WEB-EMPRESTIMOS-001-interface-emprestimos.md).

Nas mutações idempotentes já consumidas por movimentações, manutenções,
reavaliações e empréstimos, a Web conserva chave e payload em timeout, falha de
rede, response inválida, erro `5xx` ou `OPERACAO_EM_PROCESSAMENTO`. Falha
conclusiva descarta a chave somente quando não existe resultado anterior ainda
incerto; em movimentações, por exemplo, um `401` durante a recuperação não
resolve a incerteza de uma tentativa anterior com `503`. O conflito
`CHAVE_IDEMPOTENCIA_REUTILIZADA` sempre descarta a chave e exige nova
confirmação manual. `OPERACAO_JA_PROCESSADA` continua sendo conflito visível,
atualiza apenas a leitura relacionada e oferece a navegação existente, sem
replay de sucesso, polling ou retry automático. Consulte
[WEB-IDEMPOTENCIA-001](../../tasks/WEB-IDEMPOTENCIA-001-adaptar-conflitos-operacoes.md).

## Transporte HTTP

Os clientes centrais usam o `fetch` nativo dos runtimes atuais do Next.js. A
abstração comum concentra somente comportamento transversal:

- composição de base URL, path e query;
- serialização JSON;
- headers comuns não sensíveis;
- timeout e `AbortSignal`;
- parsing e validação opcional da response;
- normalização de erros;
- observabilidade permitida.

Ela não contém hook React, toast, navegação, regra de negócio, permissão, cache
de biblioteca específica ou token global sem política definida.

O timeout padrão atual é um limite operacional, não uma meta de latência. Cada
fluxo crítico deve definir e medir seus próprios limites antes de alterar o
baseline.

## Runtimes

| Runtime       | Base URL                  | Pode acessar segredo   | Credenciais              |
| ------------- | ------------------------- | ---------------------- | ------------------------ |
| navegador     | `/api/backend`            | não                    | política do navegador    |
| servidor Next | `${API_INTERNAL_URL}/api` | sim, quando autorizado | encaminhamento explícito |

Uma instância universal que detecta `window` pode misturar código server-only
no bundle e esconder decisões de credenciais. A integração usa a mesma
abstração com duas instâncias centrais, uma por runtime.

## Operações e estado remoto

Uma operação representa:

```text
método HTTP + path + contrato de entrada + contrato de resposta
```

Client Components de movimentações usam hooks específicos para operações assíncronas,
sem implementar cache próprio. Server Components chamam funções assíncronas comuns.
Não instale ou configure uma biblioteca de cache antes de existir um fluxo que
defina query keys, invalidação, retry e consistência.

## Regras centrais

- Componentes não chamam `fetch` diretamente.
- Uma operação representa um método e endpoint específicos.
- Clientes são centralizados; não crie instâncias por feature ou hook.
- Requests e responses usam contratos existentes quando disponíveis.
- Response HTTP é dado não confiável e deve ser validado.
- Segredos e URLs internas não entram no bundle do navegador.
- Mutações não recebem retry automático sem uma política explícita.
- Credenciais de navegador usam cookie `HttpOnly`; detalhes de autenticação e
  CSRF são decisões conjuntas.
- Métricas usam nomes normalizados e baixa cardinalidade.

## Fluxo Web de autenticação implementado

`WEB-AUTH-001`, `CONTRACTS-009` e `AUTH-004` implementam o fluxo:

```text
anônimo
  └─ POST /auth/login
       ├─ trocaSenhaObrigatoria = true
       │    └─ /redefinir-senha
       │         └─ POST /auth/concluir-primeiro-acesso
       │              └─ cookie rotacionado → /senha-atualizada → /dashboard
       └─ trocaSenhaObrigatoria = false
            └─ /dashboard
```

As operações de navegador usam `/api/backend`, enviam o sinal público de CSRF
nas mutações e não leem o cookie `HttpOnly`. Server Components que consultarem
`/auth/me` encaminham explicitamente o header `Cookie` recebido, usam o cliente
server-only e desabilitam cache para não misturar identidades.

As páginas protegidas confirmam a sessão por `/auth/me`; não foi necessário
adicionar Proxy do Next.js. A API continua aplicando autenticação, pendência de
primeiro acesso e perfil em toda operação.

Responses `401`, `403` por primeiro acesso e `403` por perfil são estados
distintos. A Web redireciona apenas os dois primeiros casos aplicáveis ao
fluxo; falta de perfil permanece negação de acesso, não expiração de sessão.

## Documentos

| Assunto                             | Documento                                                      |
| ----------------------------------- | -------------------------------------------------------------- |
| Clientes, operações e contratos     | [Clientes e operações](./clients-and-operations.md)            |
| Hooks de operações cliente          | [Hooks de API](./client-hooks.md)                              |
| Erros, cache, cancelamento e testes | [Erros, cache e testes](./errors-cache-and-testing.md)         |
| Sessão, cookie, CSRF e perfis       | [Identidade e acesso](../../security-and-access.md)            |
| Limites e métricas da integração    | [Performance](../../performance/contracts-and-integrations.md) |
| Fontes oficiais                     | [Referências](./references.md)                                 |

## Decisões pendentes

- biblioteca de estado remoto e regras gerais de cache;
- retry para operações ainda não cobertas por política explícita;
- propagação de correlation ID para dependências externas;
- provedor de observabilidade, retenção, alertas e metas.

Não escolha essas políticas silenciosamente apenas para completar a estrutura.

## Recuperação de senha implementada

`WEB-AUTH-002` é o consumidor Web dos endpoints existentes. O pedido pode
ser iniciado em `/esqueci-senha` na Web ou no app, mas o token enviado por
e-mail sempre é consumido pela Web:

```text
Web ou mobile
  └─ POST /auth/esqueceu-senha
       └─ e-mail → /recuperar-senha#token=...
            └─ POST /auth/redefinir-senha
                 └─ /recuperacao-concluida
                      ├─ sipat://login?origem=recuperacao-senha
                      └─ /login
```

O fragmento não é enviado ao servidor. A fronteira Client valida o formato,
mantém o token somente em memória e remove o fragmento da URL. O deep link de
retorno nunca carrega o token e não cria sessão. `/redefinir-senha` continua
sendo a página autenticada do primeiro acesso.

Consulte o [contrato de execução](../../tasks/WEB-AUTH-002-recuperar-senha.md).

## Relatórios e transporte de PDF

As operações de relatórios usam os clientes centrais, schemas específicos e
no-store. A opção `responseType: "pdf"` mantém timeout, AbortSignal e erros JSON
normalizados, limita o corpo a 10 MiB e valida MIME e assinatura PDF.
O hook impede emissão duplicada, cancela ao desmontar e libera a Object URL.
Cada emissão consulta novamente o banco; a prévia não é um snapshot exportável.
[Semântica e limites](../../apps/api/relatorios-patrimoniais.md).
