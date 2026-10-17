# Segurança do aplicativo mobile

Este documento cobre o cliente Android/iOS. Transporte, contrato e identidade
também pertencem à
[Integração mobile–API](../../integrations/mobile-api/README.md). A API continua
responsável por autenticação, autorização, validação e auditoria.

## Estado atual

O aplicativo acessa apenas o health check público. Não existem login, token,
refresh, dados patrimoniais persistidos, biometria, permissões sensíveis ou
operação protegida. Portanto, o estado atual não atende por si só os requisitos
de autenticação e autorização do SIPAT.

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

A política de autenticação ainda precisa ser definida. Quando existir:

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
  `braces`, `node-forge` e `decode-uri-component` não tiverem uma atualização
  compatível com o Expo SDK 57;
- execute `pnpm security:patches` após instalar dependências e remova cada patch
  assim que uma versão oficial corrigida puder substituí-lo;
- não versione keystore, certificado, profile ou chave privada;
- restrinja acesso ao projeto, token Expo e credenciais de loja;
- verifique o artefato assinado e a origem do build antes de distribuir.

Os patches atuais limitam a profundidade de chaves processada pelo `braces`,
validam a quantidade de elementos ASN.1 aninhados no `node-forge` e substituem
o decoder recursivo de URI por uma leitura linear compatível com CommonJS. Eles
mitigam, respectivamente,
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) e
[GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), sem
alterar Expo, React Native, Metro ou Expo Router.

Auditorias baseadas apenas no número da versão, incluindo `pnpm audit` e o
Dependabot, podem continuar exibindo esses três avisos porque não inspecionam o
conteúdo dos patches locais. Não ignore nem encerre os avisos sem registrar a
existência dos patches e a execução bem-sucedida de `pnpm security:patches`.

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
