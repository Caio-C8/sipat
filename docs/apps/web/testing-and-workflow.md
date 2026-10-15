# Testes e workflow

## Antes de implementar

Confirme:

- objetivo, usuário e ação principal da página;
- rotas e metadata;
- estados de loading, vazio, erro, sucesso e permissão;
- contratos realmente disponíveis;
- componentes e tokens existentes;
- comportamento responsivo;
- requisitos de teclado e foco;
- riscos de segurança;
- necessidade de Client Components;
- se a tarefa também inclui integração com a API.

Se a integração fizer parte do trabalho, leia
[Integração web–API](../../integrations/web-api/README.md). Não invente
endpoint, autenticação, formato de erro ou cache para desbloquear uma tela.

## Ordem recomendada

1. descrever estados e fluxo do usuário;
2. definir rota, layout e metadata;
3. desenhar estrutura semântica e responsiva;
4. localizar primitives existentes;
5. implementar a composição server-first;
6. criar fronteiras Client somente onde necessárias;
7. implementar formulários e validação;
8. implementar hooks e operações se a integração estiver no escopo;
9. revisar segurança, acessibilidade e desempenho;
10. testar estados, viewports e teclado;
11. executar verificações automatizadas e build.

## Estratégia de testes

| Alvo                  | Verificação principal                                |
| --------------------- | ---------------------------------------------------- |
| primitive             | variantes, semântica, teclado e foco                 |
| componente de feature | comportamento, eventos e estados                     |
| formulário            | defaults, validação, transformação e submissão       |
| hook remoto           | parâmetros, estados, cancelamento e erro normalizado |
| operação HTTP         | URL, método, payload, contrato e resposta            |
| página                | composição, metadata e estados visuais               |
| E2E                   | fluxo real, navegação e integração                   |
| responsividade        | reflow, toque, zoom e conteúdo longo                 |
| acessibilidade        | semântica, teclado, foco, contraste e anúncios       |
| desempenho            | build, bundle e métricas                             |

## Ferramentas atuais

O SIPAT usa:

- Vitest 5 como runner;
- React Testing Library para hooks e componentes;
- `jsdom` somente nos testes que precisam de DOM;
- ambiente `node` como padrão para infraestrutura, parsers e operações;
- `resolve.tsconfigPaths` nativo do Vite 8 para os aliases do TypeScript.

O script de typecheck executa `next typegen` antes de `tsc --noEmit`, evitando
que tipos de rota antigos em `.next` sejam usados pela verificação.

O SIPAT também usa:

- Playwright Test para fluxos E2E no navegador;
- Chromium como projeto automatizado inicial;
- `@axe-core/playwright` para verificações automatizáveis de acessibilidade;
- `page.route` por meio de um mock estrito próprio para controlar o boundary
  `/api/backend`;
- fixtures validadas por schemas de `@repo/contracts`;
- build de produção e `next start` durante a execução local;
- um worker, retries finitos e timeout global no CI.

MSW não foi adotado porque a interceptação nativa do Playwright atende os
cenários atuais sem introduzir outro service worker ou outra camada de mock.

## Teste visual e manual

Automação não substitui inspeção. Verifique:

- viewport estreita, intermediária e ampla;
- retrato e paisagem quando relevante;
- zoom;
- teclado;
- foco;
- reduced motion;
- loading, vazio, erro, disabled e sucesso;
- conteúdo curto e excessivamente longo;
- rede lenta e falha quando houver integração.

## Metadata

Todo teste ou revisão de página deve confirmar o título:

```text
Nome da página | Nome do projeto
```

Para metadata dinâmica, cubra sucesso, conteúdo ausente e fallback. Não gere
título com valor `undefined`, identificador bruto ou dado sensível.

## Comandos atuais

Para alteração localizada:

```bash
pnpm --filter @repo/web lint
pnpm --filter @repo/web typecheck
pnpm --filter @repo/web test
pnpm --filter @repo/web build
pnpm format:check
```

Para instalar o Chromium do Playwright em uma máquina nova:

```bash
pnpm --filter @repo/web exec playwright install chromium
```

Para executar os E2E:

```bash
pnpm --filter @repo/web test:e2e
```

Para acompanhar o navegador ou usar a interface interativa:

```bash
pnpm --filter @repo/web test:e2e:headed
pnpm --filter @repo/web test:e2e:ui
```

O script E2E cria um build de produção, inicia `next start` na porta `3100` e
encerra o servidor ao concluir. `PLAYWRIGHT_PORT` altera a porta local e
`PLAYWRIGHT_BASE_URL` desativa o servidor local e aponta a suíte para uma URL
externa.

O script `test` executa `vitest run`. No estado atual, a suíte cobre configuração
pública, cliente HTTP, normalização de rotas e operações, Web Vitals e
observabilidade. Novas features devem adicionar testes proporcionais aos seus
contratos e estados.

A suíte Playwright cobre a home, metadata, links de health, acessibilidade
automatizável, headers de segurança e execução da home sem violações CSP no
build de produção.

O mock de rede registra expectations por método e path, aceita contagem exata,
valida query e payload dentro do responder e falha no teardown quando recebe
uma request inesperada ou quando uma request esperada não ocorre. As fixtures de
response são analisadas pelos schemas compartilhados antes de serem entregues à
aplicação.

A verificação axe atual cobre a home com regras WCAG A e AA automatizáveis. Esse
resultado não comprova conformidade integral: teclado, foco em todos os estados,
zoom, contraste contextual, leitores de tela e julgamento humano continuam
exigindo revisão manual.

O CI instala somente Chromium, executa os E2E com um worker e preserva retries e
timeout finitos. A suíte foi aprovada localmente e no GitHub Actions.

O suporte de rede pode interceptar `/api/backend` e verifica expectations por
método e path. Ele deve ser usado por novas features sem transformar fixtures
de uma entrega em parte permanente da infraestrutura comum.

### Verificação local do artefato standalone

Com `output: "standalone"`, o servidor mínimo deve ser iniciado pelo
`server.js` gerado, não por `next start`. O Next.js não copia `public` nem
`.next/static` para esse diretório por padrão. O Dockerfile já copia ambos para
a imagem final; para testar o artefato manualmente no Windows, depois do build,
copie os diretórios para os destinos equivalentes sob
`apps/web/.next/standalone/apps/web` e só então execute o servidor:

```powershell
Copy-Item -Recurse -Force apps/web/public apps/web/.next/standalone/apps/web/public
Copy-Item -Recurse -Force apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
node apps/web/.next/standalone/apps/web/server.js
```

Sem essas cópias, o HTML pode responder enquanto os chunks em `/_next/static`
retornam `404`, deixando Client Components sem hidratação. Esse comportamento é
do empacotamento standalone, não da CSP.

O `ResizeObserver` ausente no jsdom possui um mock mínimo no setup porque as
primitives Radix o utilizam; o mock não substitui testes reais de layout, foco e
teclado no navegador.

Para mudança transversal:

```bash
pnpm check
pnpm format:check
pnpm build
pnpm --filter @repo/web test:e2e
```

No Next.js 16, `next build` não substitui o lint. Execute ambos.

## Definition of done

Uma página só está concluída quando:

- requisitos e estados estão implementados;
- metadata segue o padrão;
- responsividade foi verificada;
- teclado e foco funcionam;
- formulário preserva e comunica erros;
- integração, se presente, usa clientes e hooks padronizados;
- não há segredo ou HTML inseguro no cliente;
- dependências e Client Components foram minimizados;
- testes relevantes existem e passam;
- lint, typecheck, formatação e build passam;
- limitações conhecidas foram relatadas.
