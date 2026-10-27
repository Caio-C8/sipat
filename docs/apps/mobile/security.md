# Segurança do aplicativo mobile

Este documento cobre o cliente Android/iOS. Transporte, contrato e identidade
também pertencem à
[Integração mobile–API](../../integrations/mobile-api/README.md). A API continua
responsável por autenticação, autorização, validação e auditoria.

## Estado atual

O aplicativo ainda acessa apenas o health check público. O backend já expõe os
contratos e endpoints de sessão nativa; telas, armazenamento local, biometria,
permissões sensíveis e consumo de operações protegidas continuam pendentes.

## Configuração e segredos

Valores `EXPO_PUBLIC_*` são incorporados ao bundle e podem ser lidos por quem
inspeciona o aplicativo. Use-os somente para nome, ambiente, URL pública e
outros valores intencionalmente públicos. Chave privada, senha, token de
serviço, credencial de banco e segredo de assinatura nunca entram no app,
`.env` público, `app.json` ou `extra`.

Se um serviço externo exigir segredo, a API do SIPAT faz a integração no
servidor. Marcar uma variável como Secret no EAS não protege um valor que acaba
incluído no bundle cliente.

## Transporte de rede

- staging e produção usam somente HTTPS com certificado válido;
- HTTP e IP local ficam restritos ao desenvolvimento em rede confiável;
- não desabilite validação TLS para fazer um aparelho conectar;
- não exponha PostgreSQL nem interfaces administrativas junto da API;
- CORS protege navegadores, não autentica o aplicativo nativo;
- pinning de certificado só deve ser adotado após threat model, rotação e plano
  para expiração; um pin antigo pode interromper todos os clientes instalados.

## Sessão e armazenamento

A política e o backend da primeira sessão nativa estão implementados. O cliente
deve manter o access token opaco de dez minutos em memória e o refresh token
opaco rotativo no `expo-secure-store`, dentro dos limites lógicos de oito horas
absolutas e trinta minutos de inatividade. A fonte completa da decisão é
[Autenticação e armazenamento](../../integrations/mobile-api/auth-storage.md).

Ao implementar:

- mantenha access token em memória quando o fluxo permitir;
- armazene material de renovação somente em mecanismo seguro de Keychain/
  Keystore, como `expo-secure-store`, após decisão arquitetural;
- não use AsyncStorage para token, senha ou segredo;
- persista o mínimo necessário e defina expiração, rotação, revogação e logout;
- trate indisponibilidade, cancelamento biométrico e mudança de biometria;
- apague credenciais e caches privados no logout;
- considere que o comportamento de persistência após desinstalação difere entre
  Android e iOS;
- não use armazenamento local como fonte única de um dado irrecuperável.

`SecureStore` reduz a exposição em repouso, mas não torna um token inacessível
ao próprio processo. Aparelho comprometido, instrumentação do runtime ou código
malicioso no app ainda podem capturar uma credencial durante o uso. Access
curto, rotação, detecção de replay, revogação e expiração limitam o impacto;
biometria, DPoP, attestation, detecção de root/jailbreak e pinning permanecem
evoluções separadas orientadas por threat model.

Biometria protege o acesso local a uma credencial; ela não autentica sozinha o
usuário perante a API nem substitui autorização.

## Dados no dispositivo

Antes de cachear dados patrimoniais, classifique sensibilidade, necessidade
offline, expiração, criptografia, backup, captura de tela e limpeza. Não
persista toda a árvore de estado por conveniência. Logs, clipboard, notificações
e relatórios de crash também podem vazar conteúdo mesmo sem banco local.

## Deep links e conteúdo externo

Trate deep link, QR code, arquivo e URL recebidos pelo app como input não
confiável. Não transporte credencial ou dado sensível em link. Valide esquema,
host, path e parâmetros antes de navegar ou abrir outro aplicativo. Links de
retorno de autenticação exigem nonce/state e fluxo documentado.

## Permissões nativas

Solicite câmera, fotos, localização, notificações ou biometria somente no
contexto da ação e explique a finalidade. O app deve lidar com negação,
restrição permanente e revogação posterior. Remova permissões que deixarem de
ser necessárias e mantenha as declarações das lojas coerentes com o uso real.

## Erros e observabilidade

Não registre token, senha, header de autorização, payload pessoal, arquivo,
URL com query, identificador bruto ou conteúdo completo de response. Mensagens
ao usuário não exibem stack nem erro interno. Métricas usam nome de operação e
rota normalizados, com baixa cardinalidade.

## Dependências e cadeia de build

- use dependências necessárias e versões compatíveis com o SDK;
- revise config plugins, permissões e código gerado;
- preserve lockfile e versões de Node/pnpm do EAS;
- mantenha os patches transitivos registrados em `pnpm-workspace.yaml` enquanto
  `node-forge` e o Zod 3 da cadeia de build não tiverem atualização oficial
  compatível;
- execute `pnpm security:patches` após instalar dependências e remova cada patch
  assim que uma versão oficial corrigida puder substituí-lo;
- não versione keystore, certificado, profile ou chave privada;
- restrinja acesso ao projeto, token Expo e credenciais de loja;
- verifique o artefato assinado e a origem do build antes de distribuir.

As correções oficiais transitivas atualmente fixadas por `overrides` incluem
`fast-uri@3.1.9`, `body-parser@2.4.0`, `multer@2.5.0`, `vite@8.3.5`,
`source-map-js@1.2.2` e `uuid@11.1.1`, além das linhas corrigidas de
`brace-expansion`. A fonte de verdade permanece `pnpm-workspace.yaml`, e o
`pnpm-lock.yaml` registra as versões efetivamente resolvidas.

Os patches atuais validam a quantidade de elementos ASN.1 aninhados no
`node-forge` e fazem o Zod 3 rejeitar arrays e sets que excedem um limite
superior antes de percorrer seus elementos. Eles mitigam, respectivamente,
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) e
[GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

Na reavaliação de 24 de outubro de 2026, `node-forge@1.4.0` continuava sendo a
versão mais recente publicada e sem release oficial corrigida.
`decode-uri-component@0.5.1` já possuía a correção, mas migrou para ESM e ficava
fora do intervalo `^0.2.2` consumido por `query-string@7.1.3` no antigo Expo
Router 57. A migração para Expo Router 58 removeu essa cadeia da árvore
instalada; o patch local e sua regressão foram retirados depois de `pnpm why`
deixar de encontrar o pacote.

O patch anterior de `braces@3.0.3` foi removido depois que o GitHub retirou o
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) em 23
de outubro de 2026 por não considerar a falha explorável na prática. Não há
motivo para manter um limite local de profundidade para um advisory retirado.

Auditorias baseadas apenas no número da versão, incluindo `pnpm audit` e o
Dependabot, podem continuar exibindo os avisos mitigados porque não
inspecionam o conteúdo dos patches locais. Não ignore nem encerre os avisos sem
registrar a existência dos patches e a execução bem-sucedida de
`pnpm security:patches`.

O Expo CLI 58.1.15 ainda declara `zod@^3.25.76`; forçar Zod 4 por override
quebraria o contrato de major do consumidor. O commit oficial da correção atua
na implementação V4, por isso o patch local faz o backport mínimo equivalente
na implementação V3 realmente consumida. `pnpm security:patches` comprova que
arrays com `max`/`length` e sets com `max` não validam seus elementos depois de
uma violação do limite. Remova esse patch quando o Expo CLI adotar uma versão
oficial corrigida e a árvore instalada comprovar que o Zod 3 deixou de ser
necessário.

## Checklist de uma feature protegida

- entrada, parâmetro e response validados;
- autorização mantida na API;
- HTTPS obrigatório fora do desenvolvimento;
- credenciais ausentes de bundle, logs e armazenamento inseguro;
- comportamento de `401`, `403`, expiração e logout definido;
- deep links e arquivos tratados como não confiáveis;
- cache privado com escopo, validade e limpeza definidos;
- permissões mínimas e justificadas;
- erro público sem detalhe interno;
- teste em build nativo e aparelho real.
