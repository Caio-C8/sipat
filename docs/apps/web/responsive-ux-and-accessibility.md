# Responsividade, UX e acessibilidade

## Estado atual

A rota `/dashboard` apresenta uma visão geral responsiva dentro do shell
autenticado compartilhado. Seus totais geral e por status vêm da listagem
patrimonial; pendências, setores e atividades comunicam explicitamente que a
integração ainda não existe. O nome e o perfil vêm da identidade autenticada e
os demais módulos da navegação são apenas apresentação. A home `/` apresenta o
catálogo público de páginas e endpoints técnicos.
Em larguras menores, a navegação filtrada por perfil é apresentada por um menu
expansível com `aria-expanded`, fechamento por `Escape` e devolução de foco. Os
cartões passam de quatro para duas ou uma coluna conforme o espaço disponível.
Em monitores amplos, a área principal ocupa a largura útil e amplia tipografia,
espaçamento e cartões para evitar conteúdo comprimido no topo.
As primitives mantidas em `components/ui` são infraestrutura visual; cada
nova composição precisa ser verificada no contexto real.

## Responsividade

Adote mobile-first e expanda o layout quando houver espaço. O conteúdo deve
quebrar linhas sem sobreposição, evitar scroll horizontal da página, preservar
ações importantes e suportar zoom, fontes maiores, teclado virtual e safe
areas. Escolha breakpoints pelo ponto em que o conteúdo deixa de funcionar, não
por modelos específicos de aparelho.

## Estados e feedback

Toda interação deve comunicar loading, sucesso, erro recuperável, estado vazio e
disabled quando aplicável. Confirme ações destrutivas de acordo com o risco. Não
use toast como único lugar para uma informação necessária à correção.

## Semântica, teclado e foco

- prefira elementos HTML nativos;
- mantenha headings em hierarquia lógica;
- associe labels e descrições aos controles;
- garanta nome acessível para ações somente com ícone;
- faça toda ação funcionar sem mouse;
- preserve foco visível e ordem de tabulação lógica;
- não use `tabIndex` positivo;
- gerencie e devolva o foco em dialogs;
- não transmita significado apenas por cor;
- respeite `prefers-reduced-motion`.

## Validação

Verifique ao menos viewport estreita, intermediária e ampla, zoom de 200%,
teclado, foco, conteúdo curto e longo, estados assíncronos, contraste e reduced
motion. Automação ajuda, mas não substitui inspeção visual nem navegação por
teclado nos fluxos críticos.
