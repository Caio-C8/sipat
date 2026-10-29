# Handoff do aplicativo mobile

## Estado operacional

O mobile possui a infraestrutura inicial, a fundação visual e a autenticação
nativa. Os grupos `(auth)` e `(app)` aplicam a matriz de acesso; login, troca
obrigatória, confirmação, restauração, refresh coordenado e logout usam os
contratos de `/api/auth/mobile`. O access token fica em memória e o refresh fica
atrás do adapter `expo-secure-store` nativo.

O baseline usa Expo SDK 58, React Native 0.88 e React 19.3. A migração passou
nas verificações locais, nos três exports, no Expo Doctor e no smoke test do
container `mobile-web`; o novo binário ainda precisa ser gerado no EAS e
validado em dispositivo real.

Vitest cobre configuração, HTTP, formulários, storage, sessão, concorrência,
redirects, Home por perfil, operações de domínio, catálogo de rotas, política
de `/check` e componentes
compartilhados. A validação local também executou o
cliente contra API e PostgreSQL reais para login, refresh, primeiro acesso e
logout. O CI também
constrói e inicia o container `mobile-web`, consulta `/health` e confirma que a
raiz protegida e `/check` servem HTML sem expor o conteúdo de development.
As primeiras páginas de domínio são `/bens` e `/bens/[patrimonioId]`; ainda não
existem cache/offline ou E2E em dispositivos.

`MOBILE-UI-001` implementou o shell comum observado na página `Telas Mobile`:
topbar azul-marinho com brasão, safe area coerente e bottom bar somente em
`(app)`. Sem sessão, a topbar mantém a identificação municipal; autenticada,
substitui esse texto pelo avatar da identidade, cujo menu contém o logout.
`Início`, `Bens` e `Cadastro` são destinos ativos; Inventário e Relatórios
permanecem disabled, sem rotas placeholder.
O `DevelopmentCheckBanner` não foi alterado. `MOBILE-AUTH-003` recompôs login,
troca obrigatória e confirmação conforme os três frames do Figma, preservando
contratos, sessão e redirects; a recuperação aparece disabled, sem rota.
`INVENTARIOS-003` liberou as consultas de inventários para os dois perfis e
`MOBILE-HOME-002` integrou a Home às listagens existentes. A tela usa
`meta.total` para setores, bens e estados de inventário, além dos agregados de
`InventarioResumo.progresso`; falhas permanecem isoladas por bloco e não são
convertidas em zero.

`MOBILE-PATRIMONIOS-001` implementou listagem virtualizada, busca submetida,
filtros, paginação e detalhe nas abas `Dados` e `Valores` para os dois perfis.
As responses e o UUID são validados por `@repo/contracts`, requests obsoletas
são canceladas e o valor atual usa aritmética decimal segura. Os frames da
página `Telas Mobile` foram comparados no navegador; Histórico e Gerar ficha
foram omitidos conforme a decisão aprovada. A comparação visual da UI executada
com sessão real e as validações em dispositivos continuam pendentes.

`MOBILE-PATRIMONIOS-002` implementou `/cadastro/patrimonio`. O Diretor recebe
quatro etapas, retorno sem perda de rascunho, seleção paginada dos catálogos,
resumo do processo, residual em valor ou percentual, revisão editável,
submissão única e confirmação com a response real. O Administrador recebe
`Cadastro restrito` e a ação `Consultar bens`; o gate ocorre antes da montagem
do formulário e não dispara catálogos. Os seis frames do Figma foram abertos no
navegador em 390×844 e comparados quanto a hierarquia, cards e ações. A
comparação visual da implementação executada, tecnologias assistivas e
dispositivos reais permanecem pendentes.

`MOBILE-INVENTARIOS-002` adicionou a rota de conferência sob o setor em
andamento, `expo-camera@~58.0.14` sem permissão de microfone/áudio, scanner e
entrada manual convergindo na mesma mutation validada. A câmera é desmontada
fora de foco, durante a mutation e enquanto o modal está aberto; o callback e a
entrada manual compartilham uma trava que impede requests concorrentes. O
progresso só muda depois do refetch, e rede/timeout não produzem sucesso local.
Os frames `Conferencia de bens` (`280:257`) e `inconsistência leitura do bem`
(`280:449`) foram abertos no navegador integrado e conferidos em 390×844: a
implementação preserva título/progresso, área de câmera, campo manual, última
leitura e bottom sheet de divergência. O texto `Adicionar a ocorrência` foi
adaptado para `Continuar conferência`, pois a verificação já persiste a
divergência. A simbologia do scanner e a comparação visual da tela executada
ainda exigem etiqueta e dispositivo reais.

`MOBILE-INVENTARIOS-003` adicionou a rota validada de correção por
`inventarioId` e `itemInventarioId`, a listagem paginada das divergências
pendentes do setor e a conclusão exclusiva do setor. `Trazer para o setor
cadastrado` envia `RETORNO_AO_SETOR_CADASTRADO`; `Manter no setor onde foi
encontrado` envia `TRANSFERENCIA_CADASTRAL`, sem aceitar ou criar transferência
no cliente. A observação permanece opcional e limitada a 2.000 caracteres. As
mutations possuem trava de submissão, não recebem retry automático e só
atualizam a UI depois da response validada e do refetch aplicável. A confirmação
de conclusão informa verificados, itens que a API converterá em
`NAO_LOCALIZADO` e correções pendentes; nenhum controle chama a finalização
global do inventário.

Os frames somente leitura `Corrigir localização` (`315:43263`), `Inventário
finalizado` (`280:511`) e o modal `inconsistência leitura do bem` (`280:449`)
foram abertos no navegador integrado em 29/10/2026. A implementação preserva a
hierarquia de item, setores esperado/encontrado, escolhas, observação, contagens
e ocorrências paginadas. Conforme a decisão aprovada, o asterisco da observação
foi removido, `Inventário finalizado` virou `Conferência concluída` e `Enviar
Ocorrências` foi substituído pelo acesso às correções pendentes. A comparação
visual da UI executada em 390×844, telefone/tablet, orientação, fonte ampliada,
TalkBack e VoiceOver permanece pendente de ambiente/dispositivo.

A validação local desta entrega passou em lint, typecheck, 134 testes Vitest,
formatação, `git diff --check` e exports Expo Android, iOS e Web. A integração
real com API/PostgreSQL e a acessibilidade em dispositivos não foram repetidas
nesta execução; a fronteira mobile usa os contratos e endpoints já cobertos
pela integração de `INVENTARIOS-002`.

`MOBILE-HOME-001` tornou `/` a home autenticada inicial; `MOBILE-HOME-002`
preservou proteção, moveu o logout para o menu da topbar e adicionou conteúdo
real por perfil. `/check`
preserva o diagnóstico de runtime/API, acrescenta o
catálogo tipado de todas as rotas e atravessa o gate de restauração somente em
`development`; staging e produção aplicam a mesma decisão de sessão da home.

O bloqueio global em retrato foi removido com `orientation: "default"`. A tela
`/check` usa a largura atual da janela e apresenta os cards em duas colunas a
partir de 900 pontos lógicos; topbar, faixa e shells permitem reflow de texto.
A verificação em tablet Android, iPad, TalkBack e VoiceOver reais continua
pendente e exige um novo binário; APKs anteriores preservam a configuração
nativa antiga.

## Antes da primeira feature

1. registre a entrega no [roadmap](./roadmap.md);
2. confirme requisitos, contrato e endpoint reais;
3. defina plataformas, acesso, estados, limites e falhas;
4. decida armazenamento e offline somente se o fluxo exigir;
5. implemente operação, UI e testes na mesma fronteira verificável;
6. valide Web e builds nativos afetados;
7. atualize este handoff com o estado realmente entregue.

## Verificação da infraestrutura

```bash
pnpm --filter @repo/mobile lint
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/mobile test
pnpm --filter @repo/mobile build
pnpm mobile:doctor
pnpm format:check
```

Para distribuição, execute também o build EAS adequado e instale o artefato em
um dispositivo. Um export bem-sucedido não valida assinatura nem build nativo.
