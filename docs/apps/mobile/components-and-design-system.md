# Componentes e design system

## Estado atual

A base usa primitives do React Native e `StyleSheet`. Tokens semânticos mínimos,
`AppTopbar`, `AppBottomBar` e `DevelopmentCheckBanner` estão implementados. A
bottom bar e os formulários de autenticação usam os ícones Lucide com
carregamento de fonte pelo Expo; não foi introduzida biblioteca de componentes.
As três telas de autenticação compartilham card, botão, campo, senha, ação de
texto e feedback locais à feature. Esse conjunto não constitui um design system
definitivo do SIPAT nem deve ser promovido sem consumidor fora da autenticação.

## Quando criar um componente

Extraia quando houver responsabilidade visual nomeável, reutilização real,
isolamento de estado, redução relevante de complexidade, padronização de
acessibilidade ou necessidade de teste isolado. Não converta todo trecho curto
de JSX em uma abstração com muitas props booleanas.

## Categorias

- `components/ui`: Button, Field, Input, Card e outras primitives sem domínio.
- `components/shared`: composições usadas por domínios diferentes.
- `features/<dominio>/components`: vocabulário e comportamento do domínio.
- `app/<rota>/_components`: peças exclusivas de uma rota, promovidas apenas
  quando surgir consumidor real.

## APIs e composição

- Prefira composição e `children` a combinações de props booleanas.
- Use `Pressable` para ações e represente pressed, disabled e loading.
- Props comunicam intenção e não expõem detalhe interno desnecessário.
- Preserve `ref`, handlers e propriedades de acessibilidade quando envolver uma
  primitive nativa.
- Não acople componente visual ao formato bruto de uma response.
- Não use `any` para contornar diferenças entre plataformas.

## Tokens e temas

Concentre cor, tipografia, espaçamento, raio, sombra, elevação e tamanhos de
toque quando o produto definir tokens. Nomeie por função estável, não pelo tom
momentâneo. Tema escuro só é suportado depois de todas as superfícies, status
bar, assets e contrastes serem verificados em Android, iOS e Web.

## Primeiros elementos compartilhados aprovados

A primeira entrega deve extrair somente os tokens e componentes usados pelas
telas aprovadas:

- `AppTopbar`, com brasão e `SIPAT` conforme o Figma, presente em login, troca
  obrigatória, confirmação, home e `/check`; sem sessão exibe a identificação
  municipal e, autenticada, usa esse espaço para avatar e menu da conta;
- `DevelopmentCheckBanner`, global e exclusivo de `development`;
- primitives de botão, campo, campo de senha, card e feedback somente quando a
  reutilização entre as três telas estiver comprovada;
- tokens semânticos mínimos para superfícies, texto, borda, foco, ação primária,
  sucesso, informação e erro.

O asset do brasão deve ser local, versionado e próprio para a densidade das
plataformas. Não referencie `apps/web/public` em runtime. Se a mesma imagem for
copiada para o mobile, preserve a origem e verifique nitidez, transparência e
dimensões do arquivo final.

O protótipo é a referência visual vinculante, não uma licença para fixar a
interface na largura do frame. Para `MOBILE-UI-001`, `MOBILE-AUTH-003` e
`MOBILE-HOME-002`, o implementador deve abrir o Figma no aplicativo ou conector
oficial, acessar a página `Telas Mobile` e comparar diretamente os frames
`Login`, `Crie sua nova senha`, `Senha atualizada` e `Home`. O arquivo não deve
ser alterado. Topbar, cards, campos e espaçamentos devem responder ao espaço
disponível, safe areas, teclado, texto longo e fonte ampliada sem introduzir
diferenças visuais não justificadas no frame 390×844.

A bottom bar pertence ao layout `(app)`. Destinos ainda sem página permanecem
visíveis conforme o protótipo, mas usam estado disabled e não justificam criar
rotas placeholder. `DevelopmentCheckBanner` é uma ferramenta técnica separada
e não participa da reformulação da topbar.

## Acessibilidade

Todo componente interativo deve ter função e nome acessíveis, área de toque
adequada, estado disabled, feedback de ativação e foco coerente no Web. Texto
grande, conteúdo longo, contraste, TalkBack, VoiceOver e redução de movimento
fazem parte da revisão, não são ajustes posteriores.

Não agrupe uma árvore inteira como um único elemento acessível se isso esconder
ações internas. Não transmita sucesso ou falha apenas por cor ou ícone.

## Bibliotecas externas

Antes de adicionar uma biblioteca, confirme:

- compatibilidade com Expo SDK 58, React 19.3 e React Native 0.88;
- suporte a Android, iOS e Web exigido pela feature;
- necessidade de código nativo, config plugin e novo build;
- manutenção, licença, tamanho e dependências transitivas;
- acessibilidade e possibilidade de customização;
- se outra dependência já resolve a mesma responsabilidade.

Use `pnpm --filter @repo/mobile exec expo install <pacote>` para versões que o
Expo precisa alinhar ao SDK e revise o lockfile gerado.
