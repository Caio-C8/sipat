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

`PageHeader` é a única composição de cabeçalho principal das páginas
autenticadas. Ele recebe título, descrição e ações opcionais por composição:
texto à esquerda, ações à direita em telas amplas e reflow vertical em telas
estreitas. Uma página sem ações não cria botão, placeholder ou contêiner vazio.
Cabeçalhos de cards, seções, dialogs e drawers continuam locais, mas não repetem
o `h1` ou as ações principais da página.

`SystemFooter`, renderizado uma única vez pelo shell autenticado, é o único
rodapé de página. Features não renderizam assinatura, nome da tela ou outro
footer concorrente. `DialogFooter` e áreas de ações de formulários não são
rodapés da página e permanecem permitidos quando semanticamente necessários.
Essa consolidação foi executada pela extensão de
[WEB-SHELL-002](../../tasks/WEB-SHELL-002-navegacao-estados-globais.md).

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
ícones Lucide e aliases locais. A infraestrutura atual preserva as primitives
genéricas `AlertDialog`, `Alert`, `Badge`, `Button`, `Card`, `Checkbox`,
`Combobox`, `Dialog`, `Drawer`, `Field`, `Input`, `Label`, `Pagination`,
`RadioGroup`, `Select`, `Separator`, `Skeleton`, `Table`, `Textarea` e
`Toaster`.

As composições em `components/shared` cobrem campos, resumo focável de erros,
filtros simples, paginação, inputs numéricos e o shell visual de modais
roteáveis. `RouteModal` compõe a primitive `Dialog` e delega à feature a
navegação, o conteúdo e as regras de fechamento. Regras, contratos e operações
continuam nas respectivas features.

O tema claro centraliza a identidade visual nos tokens: primário `#1E3A5F`,
azul profundo `#0F2644`, apoio `#2A4F7A`, dourado `#D4A017`, dourado claro
`#F5C842`, interativo `#2563EB`, fundo `#F8FAFC`, superfície `#FFFFFF`, texto
`#0F172A`, texto auxiliar `#64748B` e borda `#E2E8F0`. Controles interativos
usam foco dourado de 3 px com afastamento de 2 px; estados continuam
identificados também por texto, ícone ou semântica, e não somente pela cor.

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

### Padrão implementado para a evolução Web

A evolução `WEB-UI-001` implementou a fundação abaixo. A adoção pelas demais
telas continua incremental para preservar o comportamento de cada vertical:

- Select atende conjuntos pequenos e fixos; Combobox atende catálogos extensos,
  remotos ou pesquisáveis. Ambos compartilham `Field`, tokens e estados;
- filtros simples podem usar uma configuração compartilhada, mas colunas,
  validações e regras permanecem na feature do domínio;
- tabelas são composições sobre a primitive `Table`, não um componente universal
  com condicionais para todos os domínios;
- paginação, ação de consulta, estados vazios e feedback terão composições
  comuns;
- valores monetários são digitados com até sete casas e exibidos com exatamente
  sete casas em Web e relatórios;
- `components/ui` não conhece rota, perfil, contrato HTTP ou entidade SIPAT.

O contrato executável está em
[WEB-UI-001](../../tasks/WEB-UI-001-fundacao-visual-formularios.md).

`WEB-PATRIMONIOS-002` aplicou esse padrão à pesquisa, ao cadastro, à ficha e
aos quatro drawers patrimoniais: campos semânticos compartilhados, tabelas e
cards sobre primitives, `Alert` persistente para correção, erro de campo junto
ao controle e toast somente para confirmação não bloqueante.

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

### Regra para novas páginas

- Toda nova página ou componente visual deve usar utilitários Tailwind
  diretamente em `className`. Não crie arquivos `.module.css` para estilizar
  composições locais.
- Priorize sempre classes canônicas do Tailwind. Use valores arbitrários somente
  quando não houver utilitário equivalente e a medida ou cor específica for
  necessária para preservar a identidade visual.
- CSS global permanece restrito ao carregamento do Tailwind, tokens do tema e
  estilos-base realmente compartilhados.
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
