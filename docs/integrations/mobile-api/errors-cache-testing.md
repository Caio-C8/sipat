# Erros, conectividade, cache e testes

## Categorias de erro

Uma futura normalização deve distinguir no mínimo:

- configuração ausente ou inválida;
- rede/offline e falha TLS;
- timeout;
- cancelamento solicitado;
- resposta HTTP com status público;
- JSON ou contrato de response inválido;
- não autenticado, não autorizado e sessão expirada;
- conflito, rate limit e indisponibilidade.

A interface escolhe a mensagem adequada. Não revele stack, URL interna, query,
credencial ou corpo bruto.

## Timeout e cancelamento

Timeout não é status HTTP e cancelamento não é necessariamente erro visível. A
operação deve impedir que uma resposta antiga substitua o estado de uma busca
mais nova. Ao ir para background ou sair da tela, cancele quando isso preservar
recursos e semântica; não presuma que toda request precise ser abortada.

O health check e as leituras atuais da Home possuem timeout de oito segundos.
Novas operações devem definir limites próprios com base no fluxo e medição.

## Retry

- leitura idempotente pode repetir de forma limitada diante de falha transitória;
- erro de validação, autenticação e autorização não entra em loop;
- `429` segue política e `Retry-After` quando aplicável;
- mutation não repete automaticamente sem chave/contrato de idempotência;
- reconexão não deve produzir tempestade de requests.

## Cache e persistência

Antes de cachear, defina:

- escopo público ou por usuário;
- dado que pode ir ao disco;
- validade e evento de invalidação;
- limite de tamanho e política de limpeza;
- migração entre versões;
- comportamento no logout;
- diferença entre memória e persistência;
- privacidade de backup e observabilidade.

Um cache privado nunca é compartilhado entre identidades. Dado sensível não é
persistido em armazenamento não criptografado apenas para acelerar a tela.

## Política aprovada para o cache em memória

`MOBILE-QUERY-001/002/003` adota TanStack Query v5 somente para dados de domínio
autenticados. A fundação e o isolamento por sessão foram implementados em
`MOBILE-QUERY-001`; as famílias abaixo passam a usar o cache somente quando os
hooks forem migrados por `MOBILE-QUERY-002`.

| Família de dados                                       | `staleTime` | Invalidação adicional                                |
| ------------------------------------------------------ | ----------- | ---------------------------------------------------- |
| Home, listas e detalhes patrimoniais                   | 30 segundos | mutation patrimonial relacionada                     |
| Inventários, setores, itens, pendências e agregados    | 30 segundos | mutation do inventário/setor/item relacionado        |
| Setores, espécies, naturezas e processos de referência | 5 minutos   | mutation futura que altere o catálogo correspondente |

- o cache existe somente em memória e usa o `gcTime` padrão de cinco minutos
  do TanStack Query v5 para queries inativas;
- não existe persister, hidratação, AsyncStorage, SecureStore ou disponibilidade
  offline do cache;
- query keys são arrays determinísticos, incluem parâmetros normalizados,
  paginação e identificadores do recurso e não incluem token, e-mail, nome ou
  ID da identidade;
- logout, expiração ou troca de identidade cancelam trabalho pendente e limpam
  `QueryCache` e `MutationCache`; refresh da mesma identidade não limpa dados;
- queries e mutations usam `retry: false`; a recuperação única de `401` seguro
  continua exclusivamente em `SessionManager.authorizedRequest`;
- atualização manual chama `refetch` mesmo com dado fresco;
- nas plataformas nativas, ao voltar para `AppState.active`, o `focusManager`
  revalida apenas queries vencidas; Web preserva o lifecycle do navegador e não
  haverá polling nem integração de reconexão nesta entrega;
- a `queryFn` encaminha seu `AbortSignal` à operação existente, preservando
  cancelamento de request obsoleta;
- dado cacheado permanece visível durante refetch em background e continua
  identificado como último resultado confirmado;
- mutations não são otimistas nem repetidas automaticamente. Após sucesso,
  invalidam somente as raízes de domínio potencialmente alteradas;
- health check, login, refresh, `/me`, primeiro acesso, recuperação de senha e
  logout permanecem fora do cache.

A matriz de invalidação está especificada em
[`MOBILE-QUERY-003`](../../tasks/MOBILE-QUERY-003-invalidar-apos-mutations.md).
Persistência, reconexão observada, modo offline e fila exigem objetivos futuros.

## Offline e sincronização

Modo offline exige contrato próprio: quais leituras ficam disponíveis, quais
mutations podem ser enfileiradas, ordem, deduplicação, idempotência, conflito,
expiração e feedback. O usuário precisa distinguir dado confirmado, local e em
sincronização. Não descarte mutation silenciosamente nem marque como concluída
antes da confirmação da API.

## Observabilidade

Registre nome conhecido da operação, resultado, status, duração, bytes e
categoria de erro. Correlation ID pode aparecer como referência de suporte,
mas não como identidade ou label de alta cardinalidade. Nunca registre token,
payload, arquivo, URL bruta ou dado pessoal.

## Testes

Operações devem cobrir URL, método, query, headers, body, `204`, response válida,
response incompatível, status relevantes, timeout, cancelamento e ausência de
segredo. Hooks devem cobrir lifecycle, resposta obsoleta, retry, chave e
invalidação.

Testes integrados precisam incluir pelo menos sucesso, offline, timeout,
`401`/`403`, sessão expirada, conflito e retomada. Mocks não substituem uma
verificação real entre app, contrato e API nem teste em build release.
