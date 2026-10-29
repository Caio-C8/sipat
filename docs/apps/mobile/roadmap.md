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
