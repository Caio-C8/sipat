# Componentes e design system

## Quando criar um componente

Extraia um componente quando houver pelo menos um benefício concreto:

- responsabilidade visual nomeável;
- reutilização real;
- isolamento de comportamento ou estado;
- redução relevante de complexidade;
- fronteira Client menor;
- necessidade de teste isolado;
- padronização visual ou de acessibilidade.

Não extraia cada fragmento curto de JSX. Uma pequena repetição pode ser mais
legível que uma abstração com muitas props condicionais.

## Categorias

### Primitives

`components/ui` contém peças básicas do design system:

- Button;
- Input;
- Field;
- Dialog;
- Select;
- Table;
- Tooltip;
- outras primitives adicionadas conforme necessidade.

Primitives não conhecem domínio, rota, permissão ou chamada HTTP.

### Componentes compartilhados

`components/shared` contém composições usadas por domínios distintos, como
estrutura de página, cabeçalho reutilizável ou feedback padronizado.

Um componente usado por duas telas do mesmo domínio pode permanecer na feature.
Compartilhamento técnico não significa compartilhamento semântico.

O shell autenticado implementado em `components/shared` reúne as composições de
sidebar e topbar. O layout e a topbar permanecem Server Components; sidebar
móvel, breadcrumb dependente do pathname, notificações e menu do usuário são as
fronteiras Client que possuem comportamento interativo.

### Componentes de feature

`features/<dominio>/components` contém componentes que conhecem o vocabulário
e a experiência daquele domínio.

### Componentes de rota

`app/<rota>/_components` contém elementos exclusivos da página. Promova-os
somente quando surgir um consumidor real fora da rota.

## shadcn/ui

shadcn/ui é o baseline para primitives quando oferecer um componente adequado.
Ele adiciona código ao repositório; o projeto passa a possuir e manter esse
código.

Ao adotá-lo:

- inicialize a configuração conscientemente;
- fixe estilo, aliases e estratégia de CSS no `components.json`;
- adicione somente os componentes necessários;
- mantenha primitives em `components/ui`;
- coloque composições de negócio fora de `components/ui`;
- revise o diff gerado pela CLI;
- preserve customizações ao atualizar um componente;
- teste acessibilidade depois de compor ou modificar a primitive.

Não instale um componente porque ele pode ser útil futuramente. Evite carregar
dependências e estilos sem consumidor.

### Estado implementado

`components.json` usa o estilo `radix-nova`, Tailwind CSS 4, CSS variables,
ícones Lucide e aliases locais. A infraestrutura atual preserva as primitives genéricas
`AlertDialog`, `Alert`, `Badge`, `Button`, `Checkbox`, `Dialog`, `Field`,
`Input`, `Label`, `RadioGroup`, `Select`, `Separator`, `Skeleton`, `Table`,
`Textarea` e `Toaster`.

Não há composição de domínio no baseline. Ao iniciar as telas do SIPAT, remova
primitives que não forem usadas ou mantenha-as somente quando fizerem parte
conscientemente do kit visual do produto. A presença de uma primitive não
obriga seu uso em toda situação; controles nativos podem ser mais adequados.

### Toasts

Existe uma única instância de `Toaster` no layout raiz, posicionada no canto
inferior direito, com cores de estado, botão de fechamento e tema claro
explícito enquanto a política de temas do projeto permanece pendente. As
páginas e layouts continuam Server Components; somente a primitive do Sonner é
Client Component.

O componente que orquestra a ação decide quando apresentar o toast. Operações
HTTP permanecem sem conhecimento de mensagem visual, navegação ou Sonner. Erros
de campo e falhas recuperáveis devem continuar próximos do formulário ou do
diálogo; toast não é o único lugar para informação necessária à correção.

## Composição

Prefira composição, slots e `children` a um componente que recebe várias props
booleanas para representar telas distintas.

Evite:

```text
<Card compact editable admin destructive withFooter ... />
```

Quando combinações mudam estrutura e comportamento, use componentes explícitos
ou composições menores.

## Variantes e tokens

- Use tokens para cor, tipografia, espaçamento, raio, sombra e estados.
- Não espalhe cores literais para representar o mesmo significado.
- Nomeie tokens por função quando a semântica for estável.
- Estados hover, focus, disabled, invalid e loading fazem parte do componente.
- Variantes devem representar diferenças visuais coerentes, não regras de
  negócio escondidas.
- Tema escuro só deve ser prometido quando todos os componentes forem testados.

## API de componentes

- Props devem comunicar intenção.
- Prefira tipos do React para elementos nativos quando a primitive os envolve.
- Preserve `ref`, atributos ARIA e event handlers quando a composição exigir.
- Não aceite `any` para facilitar composição.
- Não exponha estado interno sem necessidade.
- Não acople primitive ao formato de response da API.

## Acessibilidade

O componente final deve manter:

- elemento semântico correto;
- label e descrição;
- foco visível;
- navegação por teclado;
- nome acessível para ações apenas com ícone;
- `aria-invalid` e mensagem associada em campos inválidos;
- gerenciamento de foco em dialogs;
- suporte a zoom, conteúdo longo e reduced motion.

ARIA complementa semântica; não transforma uma `div` em uma boa substituta
para um botão nativo sem que todo o comportamento seja reconstruído.

## Componentes externos

Antes de adicionar uma biblioteca:

- confirme compatibilidade com React 19 e App Router;
- identifique se ela exige `"use client"`;
- avalie bundle, estilos e dependências transitivas;
- confira acessibilidade e manutenção;
- carregue-a dinamicamente quando for pesada e não essencial ao primeiro
  render;
- evite duas bibliotecas para a mesma responsabilidade.

## Revisão

Ao concluir um componente reutilizável, verifique variantes, tamanhos,
conteúdo longo, teclado, foco, contraste, estado inválido, loading, disabled e
uso em viewport estreita.
