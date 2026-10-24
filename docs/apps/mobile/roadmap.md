# Roadmap do aplicativo mobile

## Baseline concluído

- [x] Expo SDK 58, React Native, TypeScript e Expo Router configurados.
- [x] Layout raiz, safe area e tela inicial técnica.
- [x] React Native Web e bundling Metro funcionando.
- [x] Configuração pública validada por ambiente.
- [x] Health check da API com timeout, cancelamento e validação da response.
- [x] Perfis EAS para development, APK interno e build de loja.
- [x] Identificadores Android/iOS, ícones e configuração de versão inicial.
- [x] Lint, typecheck, export multiplataforma e Expo Doctor disponíveis.
- [x] Testes unitários da configuração pública e do cliente de health check.
- [x] Smoke test do container `mobile-web` no CI, cobrindo `/health` e `/`.

## Próximos objetivos

- [x] remover o bloqueio global em retrato com `orientation: "default"`;
- [x] adaptar a tela baseline pela largura da janela, com duas colunas em telas
      amplas;
- [ ] validar o novo APK e build iOS em tablet Android e iPad reais, em retrato
      e paisagem, sem bordas laterais de compatibilidade;
- [ ] [`MOBILE-DEPS-001`](../../tasks/MOBILE-DEPS-001-atualizar-expo-sdk-58.md):
      atualização e validações locais concluídas; aguarda build EAS e teste em
      dispositivo real;

Nenhuma feature patrimonial do SIPAT está implementada no mobile. Antes de uma
nova entrega, registre contexto, requisitos relacionados, plataformas, rotas,
estados, contratos, endpoints, permissões, comportamento offline, segurança,
performance, acessibilidade e testes.

Capacidades como autenticação, armazenamento seguro, cliente HTTP geral, cache,
formulários, observabilidade, development build e E2E só entram no roadmap
quando uma entrega concreta definir seus critérios de aceite.
