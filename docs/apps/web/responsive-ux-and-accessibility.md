# Responsividade, UX e acessibilidade

## Estado atual

A home apresenta uma visão geral ilustrativa e responsiva. Seus números,
pendências, atividades e nome de usuário são exemplos fixos do desenho, sem
integração com a API; os demais módulos da navegação são apenas apresentação.
Em larguras menores, a navegação é apresentada por um menu expansível e os
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
