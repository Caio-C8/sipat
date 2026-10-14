# Responsividade, UX e acessibilidade

## Estado da base

A home usa uma composição simples e responsiva para apresentar a estrutura e os
health checks. Ela não contém fluxo, formulário ou modal de domínio. As
primitives mantidas em `components/ui` são infraestrutura visual; cada nova
composição precisa ser verificada no contexto real.

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
