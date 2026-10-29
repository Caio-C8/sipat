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

## Primeira entrega autenticada

As decisões de sessão nativa, estrutura visual e rotas foram aprovadas em 27 de
outubro de 2026. O backend de sessão está em validação e a execução segue esta ordem:

| Ordem | Objetivo                                                                                                                  | Status       | Dependências                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------- |
| 1     | [`MOBILE-AUTH-001`](../../tasks/MOBILE-AUTH-001-sessao-nativa.md) — sessão nativa revogável                               | em validação | `AUTH-001`, `AUTH-004` e `CONTRACTS-009`    |
| 2     | [`MOBILE-FOUNDATION-001`](../../tasks/MOBILE-FOUNDATION-001-estrutura-visual-navegacao.md) — estrutura visual e navegação | em validação | baseline mobile e referência visual         |
| 3     | [`MOBILE-AUTH-002`](../../tasks/MOBILE-AUTH-002-telas-autenticacao.md) — login e primeiro acesso                          | implementada | `MOBILE-AUTH-001` e `MOBILE-FOUNDATION-001` |
| 4     | [`MOBILE-HOME-001`](../../tasks/MOBILE-HOME-001-home-check.md) — home protegida e `/check`                                | implementada | `MOBILE-AUTH-002`                           |

`MOBILE-AUTH-001` e `MOBILE-FOUNDATION-001` podem avançar em paralelo enquanto
não alterarem o mesmo boundary. As telas e redirects só são integrados depois
que o transporte de sessão estiver verificado. O resultado esperado é:

- `/login`, `/redefinir-senha` e `/senha-atualizada` conforme os frames mobile
  do Figma;
- `/` como home autenticada dos dois perfis, inicialmente sem conteúdo de
  domínio além do shell compartilhado;
- `/check` com as verificações hoje exibidas em `/` e o catálogo das rotas
  mobile, acessível somente em `development`;
- faixa fixa de desenvolvimento em todas as telas, abaixo da safe area, com
  acesso explícito a `/check`; ela não existe em staging ou produção;
- topbar SIPAT com brasão e identificação da Câmara nas telas sem sessão; na
  área autenticada, o mesmo espaço recebe avatar e menu da conta com logout.

A Home possui as primeiras leituras patrimoniais do mobile; páginas e mutações
de domínio continuam pendentes. Antes de uma nova entrega, registre contexto,
requisitos relacionados, plataformas, rotas, estados, contratos, endpoints,
permissões, comportamento offline, segurança, performance, acessibilidade e
testes.

Cache de domínio, operação offline, biometria, attestation, pinning de
certificado, observabilidade externa e E2E nativo continuam fora desta primeira
entrega até que um objetivo próprio defina seus critérios.

## Recuperação de senha iniciada no mobile

| Ordem | Objetivo                                                                                                       | Status       | Dependências                            |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------- |
| 1     | [`WEB-AUTH-002`](../../tasks/WEB-AUTH-002-recuperar-senha.md) — consumidor Web do token                        | aprovado     | backend e contratos de recuperação      |
| 2     | [`MOBILE-AUTH-004`](../../tasks/MOBILE-AUTH-004-solicitar-recuperacao-senha.md) — solicitação e retorno ao app | implementado | `WEB-AUTH-002` e autenticação existente |

O app recebe uma nova rota pública `/esqueci-senha`, mas não recebe o token nem
define a nova senha. Ele reutiliza `POST /api/auth/esqueceu-senha`; o e-mail
abre a Web, que consome `POST /api/auth/redefinir-senha`. Depois do sucesso, a
Web pode abrir `sipat://login?origem=recuperacao-senha`. Esse retorno apenas
mostra uma confirmação neutra no login e não restaura sessão nem autentica.

A tela de e-mail não existe explicitamente no Figma. O implementador deve abrir
obrigatoriamente no navegador a página
[`Telas Mobile`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f)
e inspecionar `Login` (`334:43423`), `Crie sua nova senha` (`315:43371`) e
`Senha atualizada` (`315:43202`). A nova composição deriva desses frames e dos
componentes implementados; o arquivo permanece somente leitura.

## Paridade com o protótipo e primeira Home de domínio

As telas implementadas não correspondem ao protótipo aprovado. A correção não
é um refinamento opcional: o implementador deve abrir o arquivo Figma
`YGy7F6OGLf6FhXrVomleGk`, selecionar a página `Telas Mobile` e usar os frames
`Login`, `Crie sua nova senha`, `Senha atualizada` e `Home` como fonte visual
vinculante. O arquivo é somente leitura para esta execução e não deve ser
alterado.

| Ordem | Objetivo                                                                                                            | Status       | Dependências                            |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------- |
| 1     | [`MOBILE-UI-001`](../../tasks/MOBILE-UI-001-paridade-figma-shell.md) — topbar, tokens e bottom bar conforme o Figma | implementada | fundação atual e acesso visual ao Figma |
| 2     | [`MOBILE-AUTH-003`](../../tasks/MOBILE-AUTH-003-paridade-visual-figma.md) — paridade das três telas de autenticação | implementada | `MOBILE-UI-001`                         |
| 3     | [`INVENTARIOS-003`](../../tasks/INVENTARIOS-003-consulta-administrador.md) — leitura administrativa de inventários  | concluída    | `INVENTARIOS-001` e `INVENTARIOS-002`   |
| 4     | [`MOBILE-HOME-002`](../../tasks/MOBILE-HOME-002-home-integrada-por-perfil.md) — Home fiel e integrada por perfil    | implementada | `MOBILE-UI-001` e `INVENTARIOS-003`     |

`INVENTARIOS-003` e `MOBILE-HOME-002` fecharam a sequência sobre a autorização
real da API e o shell autenticado. A
bottom bar e os controles que apontam para páginas ainda inexistentes devem
aparecer como no protótipo, porém disabled, sem rotas placeholder. A faixa
técnica de development não faz parte da reformulação e não deve ser alterada.

## Bens e cadastro patrimonial

Esta sequência habilita os primeiros destinos de domínio da bottom bar sem
criar endpoints específicos para o aplicativo:

| Ordem | Objetivo                                                                                                        | Status       | Dependências                                 |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------- |
| 1     | [`PATRIMONIOS-004`](../../tasks/PATRIMONIOS-004-leitura-catalogos-diretor.md) — catálogos legíveis pelo Diretor | concluída    | espécies, setores e autorização existentes   |
| 2     | [`MOBILE-PATRIMONIOS-001`](../../tasks/MOBILE-PATRIMONIOS-001-consultar-patrimonios.md) — consulta de bens      | implementada | consulta backend e shell mobile              |
| 3     | [`MOBILE-PATRIMONIOS-002`](../../tasks/MOBILE-PATRIMONIOS-002-cadastrar-patrimonio.md) — cadastro unitário      | implementada | catálogos, consulta mobile e criação backend |

O navegador é obrigatório para abrir a página
[`Telas Mobile`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f)
e inspecionar diretamente cada frame referenciado nas duas tarefas mobile. O
arquivo continua somente leitura: visualizar não autoriza editar, comentar ou
reorganizar o protótipo.

`Bens` passa a navegar para listagem e detalhe para `ADMINISTRADOR` e
`DIRETOR_PATRIMONIO`. `Cadastro` passa a navegar para o formulário somente
quando a sessão é do Diretor; para o Administrador, o mesmo destino apresenta
um estado explicativo de acesso restrito, enquanto `POST /api/patrimonios`
continua protegido pela API. Inventário e Relatórios mantêm o estado atual até
seus objetivos próprios.

As diferenças aprovadas em relação aos frames são deliberadas: não haverá
cadastro de vários bens iguais, aba de histórico nem geração de ficha nesta
sequência. Esses controles não devem ser implementados como decoração ativa,
mock, chamada repetida de `POST` ou rota vazia.

## Conferência de inventário

Esta sequência habilita `Inventário` para o Diretor de Patrimônio e reutiliza
exclusivamente as operações gerais entregues por `INVENTARIOS-001` e
`INVENTARIOS-002`:

| Ordem | Objetivo                                                                                                                | Status   | Dependências                                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| 1     | [`MOBILE-INVENTARIOS-001`](../../tasks/MOBILE-INVENTARIOS-001-selecionar-iniciar-setor.md) — selecionar e iniciar setor | aprovada | contratos, API e shell mobile                   |
| 2     | [`MOBILE-INVENTARIOS-002`](../../tasks/MOBILE-INVENTARIOS-002-conferir-itens.md) — conferir por etiqueta ou número      | aprovada | tarefa anterior e validação da etiqueta real    |
| 3     | [`MOBILE-INVENTARIOS-003`](../../tasks/MOBILE-INVENTARIOS-003-corrigir-concluir-setor.md) — corrigir e concluir setor   | aprovada | tarefa anterior e ciclo operacional já entregue |

O fluxo do aplicativo começa pela seleção de um inventário `PENDENTE` ou
`EM_ANDAMENTO`, segue pela seleção de um setor e termina quando esse
`SetorInventario` fica `CONCLUIDO`. O mobile não cadastra inventários e não
executa a finalização global. O Administrador continua observador conforme
RF19 e não recebe controles mutáveis.

O navegador deve abrir os frames vinculados em cada tarefa na página
[`Telas Mobile`](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=257-2&p=f).
O arquivo permanece somente leitura. Os rótulos `Finalizar inventário` e
`Enviar Ocorrências` do protótipo não refletem as operações existentes: a UI
deve concluir o setor e navegar às divergências já persistidas, sem inventar
finalização global ou endpoint de ocorrência.

`expo-camera` entra somente em `MOBILE-INVENTARIOS-002`, com permissão de câmera
e sem áudio. Scanner e entrada manual enviam o mesmo `numeroPatrimonial`; não
há fila offline nem sucesso local sem confirmação da API.
