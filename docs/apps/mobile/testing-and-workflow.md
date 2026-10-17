# Testes e workflow

## Antes de implementar

Confirme objetivo, usuário, plataformas, rotas, estados, contratos, permissões,
comportamento offline, acessibilidade, risco de segurança e se há dependência
nativa. Leia [Integração mobile–API](../../integrations/mobile-api/README.md)
quando a entrega chamar a API. Não invente endpoint, autenticação ou cache para
desbloquear uma tela.

## Ordem recomendada

1. registre a entrega no roadmap;
2. descreva fluxo e estados;
3. defina rota e contrato;
4. componha layout adaptável e acessível;
5. implemente operação e validação no boundary;
6. adicione formulário ou persistência somente quando necessários;
7. trate rede, background, permissão e plataforma;
8. revise segurança e performance;
9. teste em Web e nas plataformas nativas afetadas;
10. execute verificações, export e build release proporcional ao risco.

## Estado da automação

O package usa Vitest para testes unitários em ambiente Node. A suíte atual cobre
a resolução da configuração pública, a descoberta da API local, respostas HTTP
sem sucesso e a validação runtime do payload de `GET /api/health`. Como o script
`test` participa do grafo do Turborepo, `pnpm check` executa essa suíte no CI.

O workflow também constrói a imagem de produção do `mobile-web`, inicia o
container e executa `healthcheck:web`. A verificação aguarda no máximo 30
segundos, exige `200` com corpo `ok` em `/health` e confirma que `/` serve HTML.
Isso valida o export Web, a imagem e o Nginx; não substitui teste de componente,
execução nativa ou comunicação real do aparelho com a API.

Ainda não há runner de componentes nem E2E em dispositivo. Essa limitação deve
permanecer explícita até uma feature justificar e validar as ferramentas
correspondentes.

Ao introduzir testes, separe:

| Alvo                | Verificação principal                                   |
| ------------------- | ------------------------------------------------------- |
| função/configuração | entradas, defaults, normalização e falhas               |
| operação HTTP       | URL, método, payload, timeout, cancelamento e contrato  |
| hook                | estados, lifecycle, retry, cache e resposta obsoleta    |
| componente          | eventos, estados e propriedades de acessibilidade       |
| formulário          | validação, teclado, foco e submissão duplicada          |
| navegação           | rota, parâmetro, Voltar e deep link                     |
| E2E em dispositivo  | fluxo real, permissão, sessão, rede e integração nativa |
| release             | instalação, inicialização, API e ausência de Metro      |

Mocks não substituem ao menos uma verificação integrada com a API e um build
nativo nos fluxos críticos.

## Comandos atuais

```bash
pnpm --filter @repo/mobile lint
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/mobile test
pnpm --filter @repo/mobile build
pnpm security:patches
pnpm mobile:doctor
pnpm format:check
```

Para reproduzir localmente o smoke test usado pelo CI, construa e inicie a
imagem antes de executar a sonda:

```bash
pnpm --filter @repo/mobile build
docker build --file docker/mobile-web.Dockerfile --target ci --tag sipat-mobile-web:ci .
docker run --detach --name sipat-mobile-web-ci --publish 127.0.0.1:8081:8080 sipat-mobile-web:ci
pnpm --filter @repo/mobile healthcheck:web
docker rm --force sipat-mobile-web-ci
```

O target `ci` reutiliza `apps/mobile/dist/web`, gerado na etapa de build, e
constrói somente a camada de runtime Nginx. Assim o smoke test não repete a
instalação e o bundling dentro do Docker. A integração mobile–API permanece
coberta pelos testes do cliente e deve ganhar E2E real quando houver fluxos de
domínio.

`build` executa `expo export` para Android, iOS e Web; ele valida bundling, mas
não gera APK/IPA nem substitui EAS Build. Para alteração transversal:

```bash
pnpm check
pnpm format:check
pnpm build
```

## Verificação manual

- abrir sem cache do Metro quando investigar artefato obsoleto;
- testar Android e iOS afetados, além de Web quando suportada;
- testar telefone, tablet Android e iPad em retrato e paisagem;
- confirmar que a janela horizontal é ocupada pelo layout adaptado, sem manter
  o app vertical com bordas laterais;
- testar rotação e redimensionamento sem perder estado ou conteúdo;
- instalar o APK release e confirmar que funciona sem Metro;
- validar API em Wi-Fi e rede móvel quando relevante;
- alternar foreground/background e orientação suportada;
- testar rede lenta, offline, timeout e resposta inválida;
- testar fonte ampliada, TalkBack/VoiceOver e teclado no Web;
- conferir nome, ícone, splash, versão e ambiente;
- verificar logs sem credenciais ou dados pessoais.

## Definition of done

Uma tela só está concluída quando requisitos e estados estão implementados,
contratos são validados, navegação funciona, teclado e acessibilidade foram
revistos, segredo não entra no bundle, performance foi considerada, testes
proporcionais existem e lint, typecheck, formatação e export passam. Mudanças
nativas também exigem um binário atualizado e verificação no dispositivo.
Nenhuma tela mobile está pronta enquanto funcionar somente em telefone ou
somente em retrato.
