# Rotas e navegação

## Estado atual

O Expo Router lê arquivos em `src/app`. O aplicativo possui grupos `(auth)` e
`(app)`, que preservam os paths públicos `/`, `/login`, `/redefinir-senha` e
`/senha-atualizada`, além de `/check`. O layout raiz concentra safe area,
topbar e faixa de desenvolvimento; os layouts de grupo ainda não aplicam
guards porque a sessão não foi implementada.

`/check` preserva a tela de infraestrutura em development. Fora desse ambiente,
ela não dispara o health check e apresenta somente o estado indisponível até a
decisão de sessão poder aplicar o redirect aprovado.

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

Autenticação ainda não existe. A primeira entrega autenticada foi aprovada nas
tarefas `MOBILE-AUTH-001`, `MOBILE-AUTH-002` e `MOBILE-HOME-001` com esta
matriz:

| Rota                | Acesso esperado                   | Destino quando o estado não permite acesso           |
| ------------------- | --------------------------------- | ---------------------------------------------------- |
| `/login`            | anônimo                           | pendência → `/redefinir-senha`; sessão comum → `/`   |
| `/redefinir-senha`  | sessão com troca obrigatória      | anônimo → `/login`; sessão comum → `/`               |
| `/senha-atualizada` | sessão válida com troca concluída | anônimo → `/login`; pendência → `/redefinir-senha`   |
| `/`                 | ambos os perfis, troca concluída  | anônimo → `/login`; pendência → `/redefinir-senha`   |
| `/check`            | pública somente em `development`  | fora de development → mesma decisão protegida de `/` |

O botão da confirmação segue para `/`. A restauração da sessão acontece antes
da decisão de rota e usa um estado neutro de inicialização para impedir flash de
conteúdo protegido. O destino seguro originalmente solicitado pode ser
preservado, mas login nunca restaura `/check` fora de development nem uma rota
incompatível com o perfil.

Em development, o layout raiz exibe em todas as telas uma faixa horizontal fixa
logo abaixo da safe area. Ela identifica o ambiente e abre `/check`; na própria
rota, informa que aquela é a tela de verificação. A faixa não é renderizada em
staging ou produção, não deve cobrir a topbar ou o conteúdo e precisa permanecer
acessível com fonte ampliada. A rota não consulta health nem revela catálogo
fora de development.

Ao implementar:

- aguarde a restauração segura da sessão antes de decidir a rota inicial;
- evite piscar conteúdo protegido;
- preserve o destino permitido depois do login;
- impeça loops entre login, renovação e rota protegida;
- limpe histórico e dados sensíveis no logout quando necessário;
- mantenha autorização e ownership na API.

Redirecionamento no cliente melhora a experiência, mas não protege endpoint.
