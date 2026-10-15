# Arquitetura da aplicação Web

## Princípios

- Use Server Components por padrão.
- Adicione `"use client"` somente na menor fronteira que precise de estado,
  efeitos ou APIs do navegador.
- Mantenha contratos externos em `@repo/contracts` e valide dados recebidos da
  API no boundary.
- Separe infraestrutura HTTP, estado remoto, formulário e apresentação.
- Não escolha biblioteca de cache ou formulário antes de existir uma feature
  que justifique essa dependência.

## Estrutura atual

```text
apps/web/
├── app/
│   ├── api/health/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx
├── components/
│   ├── ui/
│   └── web-vitals-reporter.tsx
├── e2e/
│   ├── support/
│   ├── home.e2e.ts
│   └── security-headers.e2e.ts
├── lib/
│   ├── api/
│   ├── config/
│   ├── observability/
│   └── utils.ts
└── instrumentation-client.ts
```

O estado atual ainda não possui rota nem feature de domínio do SIPAT. Ele
mantém a home técnica, health check, clientes HTTP, configuração pública,
observabilidade, testes e primitives visuais reutilizáveis.

## Responsabilidades

- `app/`: rotas, layouts, metadata e composição de página.
- `components/ui/`: primitives sem conhecimento de domínio.
- `features/<dominio>/`: operações, formulários e componentes do domínio,
  quando ele existir.
- `lib/api/`: cliente HTTP de servidor e navegador, normalização de erros e
  validação da resposta.
- `lib/config/`: configuração pública validada.
- `lib/observability/`: nomes de rota e operação com cardinalidade controlada.
- `e2e/`: comportamento real no navegador e boundary HTTP estrito.

## Server e Client Components

Página e layout permanecem no servidor sempre que possível. Um componente
cliente não deve transformar toda a árvore acima dele em cliente. Passe apenas
dados serializáveis pela fronteira e mantenha segredos, cookies sensíveis e
acesso direto à infraestrutura no servidor.

## Estado

Estado de rota pertence à URL; estado visual temporário pertence ao componente;
estado remoto deve ter uma estratégia explícita de busca, invalidação e erro.
O SIPAT ainda não fixa uma biblioteca de estado remoto. Ao introduzir uma,
limite seu provider ao segmento que realmente a utiliza e documente retries,
stale time e invalidação.

## Evolução por domínio

Uma feature nova pode começar assim:

```text
app/<dominio>/
├── page.tsx
└── _components/

features/<dominio>/
├── api/
├── components/
├── forms/
└── lib/
```

Essa divisão é uma orientação, não uma obrigação de criar pastas vazias. Crie
cada camada somente quando houver uma responsabilidade concreta.
