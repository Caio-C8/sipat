# Rotas e navegação

## Estado atual

O Expo Router lê arquivos em `src/app`. O aplicativo possui somente:

- `src/app/_layout.tsx`: layout raiz com `SafeAreaProvider` e `Stack`;
- `src/app/index.tsx`: rota `/` com a tela de infraestrutura.

`experiments.typedRoutes` está habilitado em `app.json`. Os tipos são gerados
pelo Expo CLI em arquivos ignorados pelo Git quando o servidor inicia.

## Convenções

- mantenha a rota como composição e delegue comportamento à feature;
- use nomes de arquivo e grupos de rota coerentes com a intenção do usuário;
- use caminhos absolutos com as rotas tipadas;
- valide parâmetros antes de buscar dados ou montar uma operação;
- represente loading, erro, conteúdo ausente e permissão negada;
- preserve o comportamento de Voltar do sistema;
- não esconda uma operação essencial somente em gesto;
- não transforme um guard visual em autorização.

## Grupos e layouts

Grupos como `(auth)` ou `(app)` organizam rotas sem alterar o caminho. Use
layouts aninhados quando um conjunto real compartilhar Stack, Tabs, providers
ou política de acesso. Não coloque todos os providers no layout raiz por
conveniência.

## Parâmetros

Parâmetros de rota e deep links são dados externos. Valide formato, tamanho e
semântica antes de usá-los. Não use cast para transformar um parâmetro ausente
em ID válido e não mostre identificador bruto como título sem necessidade.

## Deep links

O esquema `sipat` declarado em `app.json` permite links da aplicação, mas não é
um canal seguro. Nunca transporte token, senha ou dado patrimonial sensível na
URL. Antes de publicar App Links ou Universal Links, documente domínio,
associação da plataforma, fallback, sessão ausente, link inválido e teste em
build nativo — Expo Go não representa essa integração integralmente.

## Navegação autenticada

Autenticação ainda não existe. Quando for implementada:

- aguarde a restauração segura da sessão antes de decidir a rota inicial;
- evite piscar conteúdo protegido;
- preserve o destino permitido depois do login;
- impeça loops entre login, renovação e rota protegida;
- limpe histórico e dados sensíveis no logout quando necessário;
- mantenha autorização e ownership na API.

Redirecionamento no cliente melhora a experiência, mas não protege endpoint.
