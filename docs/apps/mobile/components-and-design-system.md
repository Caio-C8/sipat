# Componentes e design system

## Estado atual

A tela técnica usa primitives do React Native e `StyleSheet`. As cores e
medidas atuais pertencem ao baseline visual da tela, não constituem ainda um
design system definitivo do SIPAT. Não existe biblioteca externa de
componentes mobile instalada.

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

## Acessibilidade

Todo componente interativo deve ter função e nome acessíveis, área de toque
adequada, estado disabled, feedback de ativação e foco coerente no Web. Texto
grande, conteúdo longo, contraste, TalkBack, VoiceOver e redução de movimento
fazem parte da revisão, não são ajustes posteriores.

Não agrupe uma árvore inteira como um único elemento acessível se isso esconder
ações internas. Não transmita sucesso ou falha apenas por cor ou ícone.

## Bibliotecas externas

Antes de adicionar uma biblioteca, confirme:

- compatibilidade com Expo SDK 57, React 19 e React Native 0.86;
- suporte a Android, iOS e Web exigido pela feature;
- necessidade de código nativo, config plugin e novo build;
- manutenção, licença, tamanho e dependências transitivas;
- acessibilidade e possibilidade de customização;
- se outra dependência já resolve a mesma responsabilidade.

Use `pnpm --filter @repo/mobile exec expo install <pacote>` para versões que o
Expo precisa alinhar ao SDK e revise o lockfile gerado.
