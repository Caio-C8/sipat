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

O health check atual possui timeout de oito segundos. Novas operações definem
limites próprios com base no fluxo e medição.

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
