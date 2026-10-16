# Autenticação e armazenamento

## Estado atual

Não existe autenticação no mobile. Este documento define restrições para a
decisão futura, não uma capacidade entregue.

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
