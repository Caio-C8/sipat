# `MOBILE-AUTH-003` — Igualar autenticação mobile ao Figma

**Status:** `aprovada`

## Objetivo

Refazer a apresentação de `Login`, `Crie sua nova senha` e `Senha atualizada`
para ficar exatamente igual aos frames correspondentes da página `Telas
Mobile`, preservando o fluxo, contratos, sessão e redirects já implementados.

## Contexto e referências

- Dependência visual: [MOBILE-UI-001](./MOBILE-UI-001-paridade-figma-shell.md).
- Comportamento existente:
  [MOBILE-AUTH-002](./MOBILE-AUTH-002-telas-autenticacao.md).
- Formulários: [documentação mobile](../apps/mobile/forms-and-validation.md).
- Sessão: [integração mobile–API](../integrations/mobile-api/auth-storage.md).
- Referência obrigatória, somente leitura:
  [Figma — Telas Mobile](https://www.figma.com/design/YGy7F6OGLf6FhXrVomleGk/Untitled?node-id=0-1&p=f),
  frames `Login` (`334:43423`), `Crie sua nova senha` (`315:43371`) e
  `Senha atualizada` (`315:43202`) observados no planejamento.

## Escopo

- manter `/login`, `/redefinir-senha` e `/senha-atualizada` e a matriz de
  acesso atual;
- recompor texto, hierarquia, cards, campos, ícones, botões, avisos, rodapé,
  estados e espaçamento conforme cada frame;
- preservar validação por schemas compartilhados, pending, erros seguros,
  limpeza de senha, refresh, logout e navegação já implementados;
- mostrar as ações representadas no protótipo que ainda não possuem página,
  como recuperação de senha, em estado explicitamente disabled e sem rota
  inventada;
- manter nome e dados reais da sessão; exemplos do Figma nunca ficam hardcoded;
- preservar KeyboardAvoidingView, scroll, foco, submit pelo teclado e
  acessibilidade, adaptando a composição sem desfigurar o frame de referência;
- atualizar testes de componente somente onde a estrutura visual ou os estados
  acessíveis mudarem.

## Fora do escopo

- alterar endpoints, schemas, storage, duração da sessão ou matriz de redirects;
- implementar recuperação de senha mobile;
- adicionar bottom bar nas rotas `(auth)`;
- alterar o `DevelopmentCheckBanner`;
- criar dados fictícios para reproduzir o protótipo.

## Decisões aprovadas

- o comportamento funcional aprovado prevalece; diferenças visuais não são
  justificadas pela implementação atual;
- ações futuras devem existir visualmente quando presentes no protótipo, mas
  ficam disabled até a página e seu fluxo serem aprovados;
- mensagens dinâmicas usam identidade e erros reais, mantendo a intenção e o
  layout do Figma;
- snapshots isolados não comprovam paridade: é obrigatória comparação da tela
  completa com topbar e estados relevantes.

## Critérios de aceite

- [ ] as três telas correspondem aos frames do Figma em 390×844, sem diferença
      visual não documentada;
- [ ] fluxo comum e primeiro acesso continuam obedecendo à matriz atual;
- [ ] pending, erro de campo, erro geral, API indisponível e sessão inválida
      preservam função e encaixam na composição aprovada;
- [ ] ação futura de recuperação é visível e disabled, sem navegação;
- [ ] nenhum exemplo de pessoa, e-mail ou patrimônio do Figma fica hardcoded;
- [ ] teclado, fonte ampliada e leitor de tela não escondem campos ou ações;
- [ ] testes existentes de auth e sessão continuam passando.

## Arquivos ou módulos potencialmente afetados

- `apps/mobile/src/features/auth/forms/auth-screen.tsx`;
- `apps/mobile/src/features/auth/forms/form-controls.tsx`;
- `apps/mobile/src/features/auth/forms/login-form.tsx`;
- `apps/mobile/src/features/auth/forms/first-access-form.tsx`;
- `apps/mobile/src/features/auth/forms/password-updated.tsx`;
- `apps/mobile/src/app/(auth)/login.tsx`;
- `apps/mobile/src/app/(auth)/redefinir-senha.tsx`;
- `apps/mobile/src/app/(auth)/senha-atualizada.tsx`;
- tokens, assets e primitives aprovados em `MOBILE-UI-001`;
- testes de formulários, componentes e redirects existentes.

Os módulos `features/auth/api`, `session` e `storage` são referências de
regressão e só devem mudar diante de uma falha funcional comprovada.

## Verificações esperadas

- lint, typecheck, testes e exports Android/iOS/Web de `@repo/mobile`;
- comparação visual no Figma para tela pronta, pending, erro e sucesso;
- testes do fluxo anônimo, primeiro acesso e sessão comum;
- inspeção com teclado, fonte ampliada e tecnologias assistivas;
- formatação e `git diff --check`.

## Pendências ou decisões bloqueantes

- Nenhuma decisão de produto pendente. Se o frame mudar, o implementador deve
  registrar a divergência e confirmar a nova referência antes de adaptar código.
