# Responsividade, UX e acessibilidade

## Estado atual

A home usa `SafeAreaView`, `ScrollView`, layout flexível e propriedades de
acessibilidade para status e ações. Ela deve ser verificada nas três
plataformas, mas ainda não comprova acessibilidade dos futuros fluxos do SIPAT.

O baseline declara `orientation: "default"` e `ios.supportsTablet: true`. A tela
técnica observa a largura atual da janela e, a partir de 900 pontos lógicos,
organiza os cards em duas colunas. A medição é atualizada após rotação e não
depende de identificar um modelo específico de tablet.

Essa alteração de orientação pertence à configuração nativa. APKs e builds iOS
gerados antes dela continuam bloqueados em retrato; gere e instale um novo
binário para validar o comportamento.

## Requisito obrigatório para tablets

Toda tela mobile do SIPAT deve:

- funcionar em telefones, tablets Android e iPads;
- suportar retrato e paisagem, salvo exceção funcional documentada por tela;
- reagir à largura e altura disponíveis, inclusive após rotação;
- ocupar a janela do aplicativo sem simular uma tela vertical de telefone com
  barras ou bordas laterais;
- adaptar navegação, colunas, espaçamento e densidade em vez de apenas ampliar
  todos os elementos;
- continuar funcional em Split View/multi-window quando a plataforma oferecer;
- preservar safe areas, legibilidade, alvos de toque e ordem de foco.

`supportsTablet` autoriza suporte a tamanhos de iPad; ele não torna o layout
responsivo nem remove uma trava de orientação. A implementação deve usar o
espaço real da janela e ser validada em dispositivos.

## Layout adaptável

- respeite safe areas, barras do sistema, teclado e recortes de tela;
- deixe texto quebrar sem sobreposição ou corte;
- suporte telefone e tablet quando a feature exigir;
- trate suporte a tablet como requisito padrão do aplicativo, não como melhoria
  opcional de uma feature;
- escolha mudanças de layout pelo espaço disponível, não por modelo de aparelho;
- verifique retrato, paisagem e redimensionamento na Web;
- evite largura/altura fixa para conteúdo que recebe texto variável;
- preserve ações essenciais quando o teclado estiver aberto.

## Estados e feedback

Toda operação deve comunicar loading, vazio, erro recuperável, sucesso,
disabled, offline e falta de permissão quando aplicável. Pull-to-refresh pode
complementar, mas não substituir, uma ação acessível. Não use toast como único
local de informação necessária para corrigir o fluxo.

## TalkBack, VoiceOver e Web

- use `accessibilityRole`, `accessibilityLabel`, descrição, estado e live region
  quando a primitive não fornecer semântica suficiente;
- mantenha ordem de leitura coerente e evite agrupamento que esconda filhos;
- anuncie mudança assíncrona importante sem repetir conteúdo excessivamente;
- não transmita significado somente por cor, posição, gesto ou vibração;
- dê nome acessível a ações somente com ícone;
- preserve foco visível e teclado quando rodar no navegador;
- respeite fonte aumentada, alto contraste e redução de movimento.

Android e iOS interpretam algumas propriedades de forma diferente. Valide com
TalkBack e VoiceOver reais; inspeção visual e automação não substituem leitor
de tela.

## Alvos de toque e movimento

Use áreas de toque confortáveis e separação suficiente entre ações. A primitive
pode usar `hitSlop` sem aumentar o desenho, desde que não sobreponha outro alvo.
Animações devem preservar legibilidade, evitar bloquear interação e oferecer
alternativa quando redução de movimento estiver ativa.

## Matriz manual mínima

- Android e iOS em pelo menos um aparelho representativo;
- tablet Android e iPad em retrato e paisagem;
- rotação com a tela aberta, sem perda de estado nem layout preso em retrato;
- Split View/multi-window quando disponível;
- viewport Web estreita e ampla;
- retrato, paisagem quando suportada e safe areas;
- fonte ampliada e conteúdo curto/longo;
- teclado aberto e hardware/back do Android;
- TalkBack, VoiceOver e navegação por teclado no Web;
- loading, vazio, sucesso, erro, offline e permissão negada;
- contraste e redução de movimento.
