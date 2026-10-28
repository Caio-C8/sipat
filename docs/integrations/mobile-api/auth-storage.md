# Autenticação e armazenamento

## Estado atual

O backend de autenticação mobile está implementado em `/api/auth/mobile`. O
cliente de `MOBILE-AUTH-002` mantém access token somente em memória, persiste o
refresh atrás de um adapter `expo-secure-store`, coordena renovação concorrente
e restaura a sessão antes de decidir a rota inicial. O adapter Web não persiste
Bearer.

## Arquitetura aprovada

A implementação nativa usa uma sessão revogável com duas
credenciais opacas, sem introduzir JWT:

- access token aleatório, com duração de dez minutos, mantido somente em
  memória e enviado em `Authorization: Bearer`;
- refresh token aleatório, armazenado somente pelo `expo-secure-store`, com
  rotação obrigatória a cada uso e detecção de reutilização;
- sessão lógica com os mesmos limites da Web: oito horas absolutas e trinta
  minutos nominais de inatividade, sem estender o limite absoluto ao renovar;
- token persistido no servidor somente como hash; responses, logs e métricas
  nunca recebem o hash ou a credencial reutilizável;
- limite atual de cinco sessões ativas por usuário contado em conjunto entre
  Web e mobile;
- logout, inativação, alteração de senha, redefinição e conclusão do primeiro
  acesso revogam as credenciais correspondentes conforme a política existente.

O access token curto é uma credencial dentro da sessão lógica, não uma sessão
independente de dez minutos. Requests autenticadas e refresh válido atualizam a
atividade conforme a mesma política limitada já usada na Web. O refresh nunca
ultrapassa as oito horas contadas do login original.

O backend deve distinguir explicitamente o transporte por cookie do transporte
Bearer. Cookie mantém `HttpOnly`, `SameSite`, Origin e CSRF. Bearer nativo não
usa CSRF porque não é enviado automaticamente pelo navegador, mas continua
submetido a TLS, rate limit, validação, autenticação, autorização e revogação.
Uma request com cookie e Bearer simultâneos é recusada para evitar precedência
ambígua.

O React Native Web não persiste Bearer em armazenamento JavaScript. Ele usa uma
implementação de transporte por cookie compatível com a política Web, atrás da
mesma interface pública de sessão, ou permanece limitado à inspeção visual até
essa implementação estar disponível.

Referências da decisão:

- [Expo SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/);
- [autenticação no Expo](https://docs.expo.dev/guides/authentication/);
- [OAuth 2.0 Security Best Current Practice — RFC 9700](https://datatracker.ietf.org/doc/html/rfc9700);
- [OWASP Mobile — autenticação e sessão](https://mas.owasp.org/MASTG/0x04e-Testing-Authentication-and-Session-Management/).

## Responsabilidades

- a API autentica, autoriza e revoga;
- o cliente coleta credencial, mantém a sessão mínima e apresenta estados;
- o roteamento evita conteúdo protegido durante restauração, mas não autoriza;
- o armazenamento seguro protege material local, não substitui controles do
  servidor.

## Credenciais

Antes de implementar, documente emissão, duração, escopo, renovação, rotação,
revogação, logout, concorrência e comportamento em múltiplos aparelhos.

Access token em memória reduz exposição persistente. Se um refresh token ou
sessão precisar sobreviver ao fechamento, use Keychain/Keystore por uma API
como `expo-secure-store`, com tratamento de erro e limpeza. Não armazene token
em AsyncStorage, estado persistido genérico, log ou analytics.

## Restauração e renovação

- apresente estado de inicialização enquanto a credencial é lida;
- evite múltiplas renovações concorrentes;
- limite tentativas e impeça loop de `401`;
- diferencie indisponibilidade da API de sessão inválida;
- não apague dados recuperáveis por falha temporária de rede;
- invalide sessão e cache privado quando revogação for confirmada;
- preserve somente o destino de navegação que seja seguro restaurar.

Na inicialização aprovada, o app lê o refresh token, solicita um novo par,
valida a identidade e somente então decide a rota. Ausência, expiração,
revogação ou reutilização confirmada remove o material local e leva ao login.
Falha temporária de rede apresenta indisponibilidade e não apaga
automaticamente uma credencial potencialmente válida.

## Biometria

Biometria pode condicionar o acesso local ao segredo, mas possui diferenças por
plataforma e pode falhar por cancelamento, lockout ou alteração das biometrias
cadastradas. Sempre ofereça comportamento de recuperação compatível com a
política do produto. Teste em aparelho real.

## Web

A execução React Native Web não deve reutilizar a estratégia nativa de token
persistido. No navegador, credenciais de autenticação seguem a arquitetura Web,
preferencialmente cookie `HttpOnly`, proteção CSRF e proxy/BFF definidos na
[integração Web–API](../web-api/README.md). Se a mesma feature suportar Web e
nativo, use implementações específicas atrás de uma interface explícita.

## Logout e troca de usuário

Logout remove credencial, estado em memória, caches privados, filas vinculadas
à identidade e arquivos temporários conforme política. Troca de usuário não
pode reaproveitar dados do usuário anterior. Falha ao revogar remotamente deve
ser tratada sem manter uma credencial local ativa indefinidamente.

Se o aparelho estiver offline, o logout ainda remove imediatamente credencial,
identidade, cache privado e conteúdo da tela. A revogação remota não pode ser
afirmada como concluída sem resposta do servidor; a sessão remanescente continua
limitada por inatividade e duração absoluta.
