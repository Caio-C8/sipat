# SIPAT - Requisitos do Sistema

> Conteúdo extraído do Documento de Especificação de Requisitos de Software. Este arquivo contém somente: requisitos funcionais, requisitos não funcionais, regras de negócio, casos de uso, matriz de rastreabilidade entre RF/RN/UC e papéis de usuários.

## Requisitos Funcionais

### RF01: Autenticação e Controle de Acesso

**Descrição:** O sistema deve permitir que usuários cadastrados se autentiquem,
acessem somente as funcionalidades compatíveis com o seu tipo de usuário e
gerenciem a própria senha com segurança.

**Informações:** E-mail, senha, perfil de usuário e situação do usuário.

**Regras:**

- Devem existir, no mínimo, os perfis ADMINISTRADOR e DIRETOR DE PATRIMÔNIO.
- Usuários inativos não devem conseguir acessar o sistema.
- O sistema deve validar a permissão do usuário antes de executar operações protegidas.
- O Administrador gerencia os cadastros administrativos definidos para o sistema; o Diretor de Patrimônio executa as operações patrimoniais previstas para os bens.
- Todo usuário ativo pode alterar somente a própria senha após confirmar a senha atual.
- Todo usuário ativo pode redefinir a própria senha por um link temporário e de uso único enviado ao e-mail institucional cadastrado.
- Para esta etapa, todo e-mail cadastrado é considerado institucional e previamente confiável, sem fluxo adicional de verificação.
- O Administrador não pode definir, alterar ou redefinir a senha de outro usuário.
- Alteração e redefinição de senha devem revogar as sessões existentes do usuário.

### RF02: Gestão de Usuários

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte, altere, ative e inative usuários do sistema.

**Informações:** Nome, e-mail, senha, perfil de usuário, situação e informações de auditoria.

**Regras:**

- O e-mail deve identificar unicamente o usuário.
- O perfil de usuário deve ser definido entre os perfis existentes no sistema.
- A inativação deve impedir novos acessos sem apagar os registros históricos vinculados ao usuário.

### RF03: Gestão de Responsáveis

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte, altere e inative responsáveis pelos setores.

**Informações:** Nome, matrícula, situação e informações de auditoria.

**Regras:**

- Todo responsável deve possuir matrícula.
- Responsável e usuário do sistema são entidades independentes.
- Responsáveis inativados devem permanecer disponíveis nos registros históricos em que já estejam vinculados.
- Responsáveis podem integrar comissões, exercendo o papel de presidente ou membro.

### RF04: Gestão de Setores

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte, altere, ative e inative setores.

**Informações:** Nome, sala, ramal, responsável atual, situação do setor e informações de auditoria.

**Regras:**

- Todo setor deve possuir um responsável.
- O responsável do setor é considerado o responsável pelos patrimônios vinculados ao setor.
- Setores inativados não podem receber novos patrimônios, transferências nem novos inventários.
- Registros de setores não devem ser excluídos fisicamente quando possuírem vínculo histórico.

### RF05: Gestão de Comissões

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte e altere comissões relacionadas às operações patrimoniais.

**Informações:** Nome, descrição, número do ato em formato textual, período de vigência, membros, papel de cada membro e informações de auditoria.

**Regras:**

- A vigência da comissão deve ser definida pelas datas.
- As datas inicial e final integram o período de vigência; a comissão está vigente quando a data de referência estiver entre ambas, inclusive.
- A data final da vigência não pode ser anterior à data inicial.
- A comissão pode ser cadastrada sem integrantes e pode possuir, no máximo, 50 integrantes no total.
- Somente responsáveis ativos podem ser adicionados como integrantes da comissão.
- Os papéis previstos para os integrantes são: PRESIDENTE; MEMBRO.
- Um responsável não pode ocupar mais de um papel na mesma comissão e cada comissão pode possuir, no máximo, um PRESIDENTE.
- Após a criação, integrantes podem ser adicionados e removidos; a alteração de um vínculo existente pode modificar somente seu papel, sem substituir o responsável vinculado.
- A inativação posterior do responsável não apaga o vínculo já registrado com a comissão.
- Enquanto a comissão não tiver sido selecionada em uma operação patrimonial, nome, descrição, número do ato, período de vigência e integrantes podem ser alterados conforme as demais regras.
- Depois que a comissão tiver sido selecionada em uma operação patrimonial, somente seu nome e sua descrição podem ser alterados.
- Quando uma operação patrimonial exigir comissão, somente uma comissão vigente poderá ser selecionada.

### RF06: Gestão de Naturezas de Bens

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte e altere naturezas de bens patrimoniais.

**Informações:** Nome da natureza, nome normalizado, descrição e informações de auditoria.

**Regras:**

- O nome normalizado deve ser utilizado para impedir cadastros duplicados com diferenças de acentuação ou capitalização.
- A natureza representa uma classificação administrativa ampla do bem e não uma classificação contábil.

### RF07: Gestão de Espécies de Bens

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte e altere espécies de bens.

**Informações:** Nome da espécie, nome normalizado, descrição, natureza vinculada e informações de auditoria.

**Regras:**

- Cada espécie deve estar vinculada a uma única natureza.
- O nome normalizado deve ser utilizado para evitar duplicidade de espécies com o mesmo nome.
- O patrimônio deve possuir uma espécie e sua natureza será obtida pela espécie vinculada.

### RF08: Gestão de Fornecedores

**Descrição:** O sistema deve permitir que o Administrador cadastre, consulte, altere, ative e inative fornecedores utilizados nos registros de aquisição e manutenção.

**Informações:** Razão social, nome fantasia, nome do representante, CNPJ, e-mail, telefone, endereço, situação e informações de auditoria.

**Regras:**

- Os fornecedores vinculados a registros existentes devem ser preservados para fins históricos.
- Fornecedores inativos não podem ser vinculados a novos processos de compra, notas fiscais e manutenções.

### RF09: Gestão de Processos de Compra e Documentos Fiscais

**Descrição:** O sistema deve permitir que o Administrador e o Diretor de Patrimônio registrem e alterem processos de compra e vincule patrimônios, fornecedores e documentos fiscais relacionados.

**Informações:** Número do processo, ano do processo, Número do empenho, ano do empenho, valor total, observações, fornecedores, notas fiscais e patrimônios vinculados.

**Regras:**

- Um processo de aquisição pode resultar em vários patrimônios.
- Um processo de aquisição pode possuir vários fornecedores e várias notas fiscais.
- O sistema deve registrar somente os itens que efetivamente se tornarem patrimônios; materiais de consumo não fazem parte deste escopo.
- A data de aquisição deve representar a data de emissão da nota fiscal.

### RF10: Cadastro de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio cadastre bens patrimoniais e suas informações de tombamento, localização, classificação e valor.

**Informações:** Indicação de existência de numeração patrimonial oficial, número patrimonial gerado pelo sistema, data de tombamento, tipo de incorporação, descrição, marca, modelo, número de série, valor de incorporação, status, espécie, setor, aquisição vinculada e parâmetros de depreciação quando aplicáveis.

**Regras:**

- O número do patrimônio e o número de série devem ser únicos.
- O usuário não deve informar nem escolher o número patrimonial no cadastro; o sistema deve gerar o próximo valor da sequência correspondente.
- Bens com numeração oficial devem usar a sequência numérica, armazenada sem zeros à esquerda, por exemplo `1`.
- Descrição, marca, modelo e número de série devem ser armazenados normalizados em letras maiúsculas e sem acentuação.
- O sistema deve manter um texto de busca composto pelos principais campos textuais do patrimônio para apoiar consultas.
- O status do bem deve admitir, no mínimo: ATIVO, BAIXADO, EMPRESTADO e EM_MANUTENÇÃO.
- Se o bem não possuir número patrimonial oficial, o sistema deve gerar um identificador em uma sequência própria, armazenado no padrão `SP-1`.
- As sequências oficial e `SP-` são independentes, crescentes, não reutilizam números já emitidos e podem possuir lacunas causadas por falha ou rollback.
- A apresentação deve completar a parte numérica para a largura mínima de seis dígitos, por exemplo `000001` e `SP-000001`, sem alterar o valor canônico armazenado nem impor limite em `999999`.
- O identificador `SP-` não representa uma etiqueta patrimonial oficial e não habilita alteração ou reimpressão de etiqueta; outras diferenças de tratamento exigem requisito próprio.
- O patrimônio deve estar vinculado a um setor; o responsável pelo patrimônio será o responsável atual desse setor.
- O patrimônio deve possuir uma espécie; a natureza será determinada pela espécie.
- Não é permitido cadastrar patrimônio sem tombamento, e o valor do bem não pode ser zero.

### RF11: Consulta, Listagem e Filtros de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio consulte, liste e filtre patrimônios cadastrados.

**Informações:** Número patrimonial, descrição, marca, modelo, número de série, status, setor, responsável, espécie, natureza e demais campos de identificação.

**Regras:**

- A busca textual deve utilizar os campos normalizados e o texto de busca mantido pelo cadastro.
- Os resultados devem permitir filtrar os bens por atributos relevantes, incluindo status e localização.
- A consulta deve exibir o responsável do bem a partir do responsável do setor atual.

### RF12: Alteração do Número Patrimonial

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio substitua o número da placa patrimonial oficial quando houver necessidade física de troca, sem baixar ou recriar o bem.

**Informações:** Patrimônio, número atual confirmado pelo solicitante, novo número patrimonial gerado pelo sistema, data e usuário responsável.

**Regras:**

- Somente o número patrimonial poderá ser alterado diretamente no cadastro do bem.
- O usuário não deve informar nem escolher o novo número; o sistema deve consumir a próxima posição da sequência numérica oficial.
- A confirmação deve informar o número atual canônico para impedir que uma repetição ou requisição concorrente substitua o número mais de uma vez.
- A substituição deve atualizar o mesmo patrimônio e registrar, atomicamente, o número anterior, o novo número, a data e o usuário responsável.
- O número anterior não pode ser reutilizado por outro patrimônio.
- Bens identificados pelo padrão `SP-` não devem ter o número alterado nem gerar reimpressão de etiqueta por esse fluxo.
- Parâmetros de depreciação não podem ser alterados diretamente; sua alteração deve ocorrer por reavaliação.
- Demais atributos do patrimônio não devem possuir edição direta por este requisito.

### RF13: Transferência de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio transfira um ou vários bens entre setores.

**Informações:** Comissão, patrimônios, setor de origem, setor de destino, data, observação e usuário responsável.

**Regras:**

- A transferência deve ocorrer somente entre setores, e não diretamente entre responsáveis.
- Uma única operação pode transferir vários patrimônios e cada patrimônio pode possuir um setor de destino diferente.
- Deve ser selecionada uma comissão vigente quando exigido pelas regras patrimoniais.
- Patrimônios baixados não podem ser transferidos.
- Setores inativados não podem ser utilizados como destino.
- A conclusão da transferência deve atualizar o setor atual do patrimônio e gerar registro histórico da movimentação.

### RF14: Reavaliação de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio registre manualmente a reavaliação de um ou vários bens.

**Informações:** Comissão, patrimônio, novo valor, nova vida útil, novo valor residual ou percentual residual, data e usuário responsável.

**Regras:**

- A reavaliação pode aumentar ou diminuir o valor do bem.
- O usuário deve informar o novo valor de cada patrimônio reavaliado.
- Patrimônios baixados não podem ser reavaliados.
- O parâmetro de depreciação vigente deve ser encerrado e um novo parâmetro deve ser criado com base nos dados reavaliados.
- A situação contábil do patrimônio deve ser atualizada, com novo valor bruto e reinício do acumulado de depreciação aplicável ao novo parâmetro.
- Cada patrimônio reavaliado deve gerar seu próprio registro histórico.

### RF15: Depreciação Automática de Patrimônios

**Descrição:** O sistema deve executar automaticamente a depreciação dos patrimônios que possuam parâmetros de depreciação vigentes.

**Informações:** Patrimônio, valor bruto atual, depreciação acumulada, valor residual, vida útil, quantidade de depreciações realizadas, valor da depreciação e data de processamento.

**Regras:**

- A depreciação deve utilizar o método linear definido pela instituição.
- A documentação registra como referência o cálculo do valor periódico a partir do valor ainda depreciável, do valor residual e da vida útil restante.
- Patrimônios baixados não podem ser depreciados.
- O valor de depreciação calculado deve ser somado ao acumulado de depreciação da situação patrimonial.
- O sistema deve preservar o valor residual como limite mínimo e registrar o histórico de cada processamento.
- O sistema não deve depreciar um patrimônio que tem seu valor líquido atual igual ao valor residual.

### RF16: Empréstimo e Devolução de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio registre empréstimos temporários de bens para pessoas ou instituições externas e posteriormente registre sua devolução.

**Informações:** Patrimônio, destinatário externo, finalidade/observação, data do empréstimo, previsão de devolução, data de devolução e identificação de agrupamento quando houver.

**Regras:**

- Somente patrimônios com status ATIVO podem ser emprestados.
- Deve ser possível emprestar vários patrimônios e identificar quando fazem parte do mesmo empréstimo.
- Cada patrimônio deve manter um registro individual que permita rastrear sua situação e sua devolução.
- Ao emprestar, o patrimônio deve assumir o status EMPRESTADO; após a devolução, deve retornar ao status ATIVO.

### RF17: Baixa de Patrimônios

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio registre a baixa de um bem patrimonial.

**Informações:** Patrimônio, data da baixa, tipo, motivo, observação, documento
anexado, comissão e usuário responsável.

**Regras:**

- Somente patrimônios ATIVOS podem ser baixados.
- A baixa deve alterar o status do patrimônio para BAIXADO.
- Toda baixa deve estar associada a uma comissão vigente na data da baixa.
- A data da baixa é uma data civil e não pode estar no futuro.
- O tipo da baixa deve ser um dos seguintes:
  - `ALIENACAO`: saída do acervo por alienação;
  - `INUTILIZACAO`: desfazimento de bem sem possibilidade ou conveniência de
    reaproveitamento ou alienação;
  - `SINISTRO`: perda decorrente de evento danoso;
  - `FURTO`: subtração do bem;
  - `EXTRAVIO`: desaparecimento ou não localização do bem;
  - `TRANSFERENCIA`: transferência permanente para fora do acervo gerenciado
    pelo SIPAT; não representa transferência interna entre setores;
  - `RECLASSIFICACAO`: desincorporação causada por mudança de classificação
    contábil; não representa alteração da espécie do patrimônio;
  - `ABANDONO`: desfazimento por abandono formalmente autorizado;
  - `ERRO_REGISTRO`: baixa de registro criado indevidamente, preservando-o para
    auditoria em vez de excluí-lo;
  - `OUTRO`: hipótese não abrangida pelos demais tipos, detalhada no motivo.
- O motivo é obrigatório e a observação é opcional.
- A operação deve gerar registro histórico e pode receber um único documento
  comprobatório PDF de até 10 MiB.
- O sistema não deve permitir estornar um patrimônio BAIXADO para que ele volte a ficar ATIVO.

### RF18: Gestão de Manutenções

**Descrição:** O sistema deve permitir que o Administrador e o Diretor de Patrimônio registre, acompanhe e conclua manutenções de patrimônios.

**Informações:** Manutenção, patrimônios enviados, datas, fornecedor quando aplicável, orçamento por item, descrição do serviço, valor do serviço, garantia, documentos e informações de recebimento.

**Regras:**

- Deve ser possível selecionar os bens enviados para manutenção e manter um item de manutenção por patrimônio.
- Cada item deve possuir orçamento próprio, que pode ser atualizado enquanto necessário.
- Ao receber o bem, devem ser registrados o serviço realizado, o valor correspondente e as informações de garantia.
- Documentos podem ser anexados no envio e/ou no recebimento.
- A manutenção não deve alterar automaticamente o valor patrimonial do bem.
- O status do patrimônio deve refletir o envio e o retorno da manutenção.

### RF19: Inventário Patrimonial

**Descrição:** O sistema deve permitir que o Diretor de Patrimônio cadastre um
inventário dos setores ativos e realize, um setor por vez, a conferência dos
patrimônios ativos incluídos, identificando bens e registrando divergências.

**Informações:** Inventário, setores incluídos, comissão, datas de início e
encerramento, patrimônio identificado, setor esperado, setor encontrado,
situação do item, estado e tipo de correção, transferência de correção quando
houver e usuário responsável.

**Regras:**

- A criação deve incluir somente os setores ativos e os patrimônios com status
  ATIVO existentes naquele momento.
- A criação deve gerar um `SetorInventario` pendente para cada setor incluído e
  um `ItemInventario` pendente para cada patrimônio incluído, preservando como
  setor esperado o setor atual do patrimônio.
- O inventário e seus setores devem iniciar pendentes e sem data de início.
- Somente um setor do inventário pode permanecer EM_ANDAMENTO por vez. O início
  do primeiro setor marca o inventário como EM_ANDAMENTO e define sua data de
  início.
- Enquanto um setor estiver EM_ANDAMENTO, operações que alterem localização ou
  elegibilidade de patrimônios desse setor, ou que usem esse setor como origem
  ou destino, devem ser bloqueadas. Os demais setores podem continuar operando.
- Movimentações registradas antes do início da conferência de um setor devem
  manter atualizados o setor esperado e o vínculo do item ainda pendente, sem
  alterar itens já verificados.
- Empréstimos e manutenções iniciados antes da conferência não impedem o início
  do setor. Se o patrimônio não estiver fisicamente disponível, o encerramento
  deve registrá-lo como NAO_LOCALIZADO e preservar o status do patrimônio e o
  vínculo com a operação vigente no momento da verificação.
- A baixa de qualquer patrimônio incluído e a inativação de qualquer setor do
  inventário devem permanecer bloqueadas até a finalização do inventário.
- O bem poderá ser identificado por leitura da etiqueta patrimonial ou por busca manual quando a leitura não for possível.
- Uma nova leitura do mesmo patrimônio no mesmo setor deve devolver o resultado
  já consolidado sem duplicar ou alterar a conferência.
- Se um patrimônio já verificado for informado em outro setor, o sistema deve
  rejeitar a segunda conferência e informar o setor e o momento da primeira. A
  existência de transferência posterior explica a nova localização; sem esse
  histórico, o caso deve ser sinalizado como movimentação física não registrada.
  Esse conflito não deve sobrescrever o item nem bloquear sozinho a conclusão
  ou a finalização.
- Quando o patrimônio estiver no setor esperado, o item deve ser registrado
  como CORRETO, VERIFICADO e sem correção.
- Quando for encontrado em outro setor, o item deve preservar o setor esperado,
  registrar o setor encontrado e ficar como DIVERGENCIA, VERIFICADO e com
  correção PENDENTE.
- A divergência pode ser corrigida durante o inventário ou permanecer pendente.
  Se o bem retornar fisicamente ao setor cadastrado, a correção deve ser
  registrada como RETORNO_AO_SETOR_CADASTRADO sem criar transferência.
- Se a correção alterar o cadastro para o setor onde o bem foi encontrado, deve
  ser criada a transferência correspondente e vinculada ao item como
  TRANSFERENCIA_CADASTRAL.
- O item do inventário deve preservar o fato de que houve divergência, vinculando a transferência usada para a correção.
- Ao concluir um setor, seus itens ainda pendentes devem ser classificados como
  NAO_LOCALIZADO e VERIFICADO na data da conclusão, registrando também o status
  cadastral observado. Quando o bem estiver EMPRESTADO ou EM_MANUTENCAO, o item
  deve apontar para o empréstimo ou item de manutenção vigente que justifica a
  ausência conhecida.
- A conclusão de um setor libera as operações que estavam bloqueadas por sua
  conferência. Divergências pendentes ainda podem ser corrigidas enquanto o
  inventário não estiver FINALIZADO.
- O inventário só pode ser finalizado depois que todos os seus setores estiverem
  CONCLUIDOS. A finalização pode preservar correções pendentes, mas deve exigir
  confirmação explícita e bloquear qualquer alteração posterior em seus setores,
  itens e correções.

### RF20: Consulta do Histórico Patrimonial

**Descrição:** O sistema deve permitir que o Administrador e Diretor de Patrimônio consulte o histórico de eventos relacionados a cada patrimônio.

**Informações:** Patrimônio, tipo de evento, data, usuário responsável, comissão quando aplicável e dados específicos da operação.

**Regras:**

- O histórico deve permitir rastrear, no mínimo, substituições de número patrimonial oficial, transferências, reavaliações, depreciações, empréstimos/devoluções, baixas, manutenções e ocorrências de inventário.
- As operações históricas não devem ser apagadas quando cadastros relacionados forem inativados.
- Os registros devem manter as informações de auditoria, registrando quem criou e quando o registro foi criado.

### RF21: Relatórios Patrimoniais

**Descrição:** O sistema deve permitir que o Administrador e o Diretor de Patrimônio gerem relatórios relacionados aos patrimônios e ao seu ciclo de vida.

**Informações:** Filtros de patrimônio, setor, status, período e tipo de informação histórica.

**Regras:**

- Os relatórios devem se restringir ao domínio patrimonial.
- Os relatórios devem utilizar os dados históricos preservados pelo sistema e permitir a conferência das informações relevantes ao patrimônio.
- Os filtros disponíveis devem ser compatíveis com os atributos existentes no cadastro e nos registros históricos.
- Deve ser possível exportar essas informações para documentos PDF.

## Requisitos Não Funcionais

### RNF01: Integridade e Preservação dos Dados

**Descrição:** O sistema deve preservar os registros necessários para garantir a integridade dos dados e dos históricos das operações patrimoniais.

**Regras:**

- O sistema não deve permitir a exclusão definitiva de entidades que possuam informações relacionadas a outros registros.
- Os registros necessários para o histórico patrimonial devem ser mantidos no banco de dados.
- As informações de auditoria devem registrar, no mínimo, `created_at`, `updated_at` e `created_by_id`.
- Os históricos relacionados aos patrimônios devem ser preservados para consulta e geração de relatórios.
- Um patrimônio baixado não deve ser estornado, mantendo seu registro histórico.
- Responsáveis inativos devem continuar disponíveis nos históricos do sistema.

### RNF02: Integridade e Consistência dos Dados Patrimoniais

**Descrição:** O sistema deve garantir a consistência das informações armazenadas referentes aos patrimônios e suas entidades relacionadas.

**Regras:**

- O número do patrimônio deve ser único.
- O número de série deve ser único quando informado.
- Os nomes normalizados de naturezas e espécies devem ser únicos.
- Uma espécie deve estar vinculada a uma única natureza.
- Um patrimônio deve possuir uma única espécie e um setor atual.
- Os valores monetários devem utilizar o formato decimal, com 13 casas decimais à esquerda da vírgula e 7 casas decimais à direita da vírgula.
- Os valores patrimoniais devem ser armazenados em Real (BRL).
- Os relacionamentos entre patrimônios, setores, espécies, naturezas, processos de compra e demais entidades devem manter sua integridade referencial.

### RNF03: Normalização e Padronização dos Dados

**Descrição:** O sistema deve manter determinados dados em formato padronizado para garantir consistência e facilitar consultas.

**Regras:**

- Os atributos descrição, marca, modelo e número de série dos patrimônios devem ser armazenados em letras maiúsculas e sem acentos.
- Os nomes de espécies devem possuir uma versão normalizada.
- Os nomes de naturezas devem possuir uma versão normalizada.
- O sistema deve manter um campo de texto de busca composto pelas informações de descrição, marca, modelo e número de série do patrimônio.
- Os dados normalizados devem ser utilizados para evitar duplicidades e facilitar a localização dos registros.

### RNF04: Desempenho nas Consultas

**Descrição:** O sistema deve proporcionar desempenho adequado nas operações de consulta e localização de informações, especialmente no gerenciamento dos patrimônios.

**Regras:**

- As consultas e listagens de patrimônios devem utilizar informações estruturadas para facilitar a localização dos registros.
- O sistema deve utilizar o atributo texto de busca, composto por descrição, marca, modelo e número de série, para melhorar a performance das buscas.
- As funcionalidades de listagem e filtragem devem permitir a localização dos registros sem necessidade de alterar os dados originais armazenados.
- O modelo de dados deve possuir estruturas adequadas para suportar as consultas relacionadas aos patrimônios e seus históricos.

### RNF05: Segurança e Controle de Acesso

**Descrição:** O sistema deve controlar o acesso às funcionalidades de acordo com o perfil do usuário, garantindo que cada usuário execute somente as operações permitidas.

**Regras:**

- O sistema deve possuir os perfis ADMINISTRADOR e DIRETOR_PATRIMONIO.
- O administrador poderá gerenciar as entidades administrativas do sistema, com exceção dos patrimônios.
- O diretor de patrimônio poderá gerenciar os patrimônios.
- Os dois perfis poderão buscar dados dos patrimônios, gerar relatórios e enviar patrimônios para manutenção.
- Operações patrimoniais que exigem autorização devem ser executadas somente pelo perfil autorizado.
- As operações relacionadas aos patrimônios que exigem comissão devem possuir uma comissão vigente associada.
- O usuário responsável pela execução de uma operação deve ser registrado por meio de `created_by_id`.

### RNF06: Rastreabilidade e Auditoria

**Descrição:** O sistema deve permitir a rastreabilidade das operações realizadas sobre os patrimônios.

**Regras:**

- As operações patrimoniais relevantes devem possuir registros históricos.
- Os registros devem identificar o usuário responsável pela operação por meio de `created_by_id`.
- Os registros devem armazenar as datas de criação e, quando aplicável, atualização.
- Transferências devem possuir histórico próprio.
- Reavaliações devem possuir histórico próprio.
- Depreciações devem possuir registros históricos.
- Baixas devem possuir histórico próprio.
- As informações de inventário e suas divergências devem ser preservadas.
- Os históricos devem permanecer disponíveis mesmo quando o responsável ou patrimônio deixar de estar ativo.

### RNF07: Responsividade e Usabilidade

**Descrição:** O sistema deve oferecer uma interface adequada aos dispositivos utilizados nas atividades de gestão patrimonial.

**Regras:**

- A interface deve permitir o uso das funcionalidades do sistema em diferentes tamanhos de tela.
- As funcionalidades utilizadas durante o inventário devem ser adequadas ao uso em dispositivos móveis.
- A interface deve permitir a utilização do processo de inventário durante a conferência física dos patrimônios.
- A utilização do sistema deve possibilitar a identificação dos patrimônios por meio do código de barras durante o inventário.

### RNF08: Disponibilidade e Controle de Operações

**Descrição:** O sistema deve impedir operações incompatíveis com o estado atual dos registros e garantir que as operações patrimoniais sejam realizadas somente quando suas condições necessárias forem atendidas.

**Regras:**

- Operações patrimoniais que exigem comissão devem ser realizadas somente quando houver uma comissão vigente.
- Patrimônios baixados não devem permitir operações incompatíveis com seu estado.
- Setores inativos não devem permitir operações relacionadas a patrimônios.
- As informações de status dos patrimônios devem ser mantidas de forma consistente.
- O sistema deve preservar os registros necessários para que operações anteriores possam ser consultadas.

### RNF09: Armazenamento de Documentos e Anexos

**Descrição:** O sistema deve permitir o armazenamento e a associação de documentos às operações patrimoniais que exigem comprovação documental.

**Regras:**

- O sistema deve permitir anexar documentos durante a baixa de um patrimônio.
- O sistema deve permitir anexar documentos aos itens de manutenção.
- Os documentos devem permanecer associados ao registro ao qual pertencem.
- O caminho ou referência do documento deve ser armazenado para permitir sua localização posteriormente.
- Os anexos não devem alterar os dados principais do patrimônio.

### RNF10: Precisão e Confiabilidade dos Cálculos Patrimoniais

**Descrição:** O sistema deve realizar os cálculos relacionados à depreciação e aos valores patrimoniais de forma consistente com os parâmetros definidos para cada patrimônio.

**Regras:**

- Os valores monetários devem ser armazenados com precisão decimal.
- A depreciação deve utilizar o método linear definido pelo sistema.
- Os cálculos devem considerar o valor bruto, a depreciação acumulada, o valor residual e a vida útil do patrimônio.
- Cada depreciação deve possuir registro da competência e do valor depreciado.
- Não deve ser possível registrar duas depreciações para o mesmo patrimônio, utilizando o mesmo parâmetro e sendo na mesma competência.
- Uma reavaliação deve invalidar o parâmetro de depreciação anterior e criar um novo parâmetro.

### RNF11: Integridade das Operações Concorrentes

**Descrição:** O sistema deve garantir que as operações que modificam o estado dos patrimônios mantenham os dados consistentes quando envolverem múltiplos registros.

**Regras:**

- Operações que envolvam vários patrimônios devem manter a associação correta entre cada patrimônio e sua operação.
- Transferências devem registrar individualmente o patrimônio, setor anterior, setor atual e comissão utilizada.
- Depreciações devem manter o registro da situação anterior e do novo valor.
- Inventários devem manter a associação entre o patrimônio, o setor esperado, o setor encontrado e eventual transferência utilizada para correção.
- Uma mesma combinação de patrimônio e inventário não deve ser registrada mais de uma vez.

### RNF12: Manutenibilidade e Organização dos Dados

**Descrição:** O sistema deve manter seus dados organizados de forma a facilitar a manutenção e evolução das funcionalidades patrimoniais.

**Regras:**

- As entidades devem possuir identificadores únicos.
- Os relacionamentos entre entidades devem ser representados por chaves estrangeiras.
- Informações que possuem domínio próprio devem ser representadas por tipos específicos (Enums), como status, perfis e tipos de operação.
- Os registros devem possuir informações de criação e atualização.
- As entidades devem manter separadas as informações de patrimônio, aquisição, manutenção, transferência, inventário, depreciação e reavaliação.

## Regras de Negócio

### RN01: Inalterabilidade dos dados cadastrais do item patrimonial

**Descrição:** Após o cadastramento de um patrimônio, seus dados cadastrais não poderão ser alterados diretamente, com exceção do número patrimonial. Alterações de setor, status, valor e parâmetros de depreciação deverão ocorrer exclusivamente por meio das operações específicas previstas pelo sistema.

### RN02: Limite de depreciação do bem

**Descrição:** O valor líquido de um patrimônio não poderá ser depreciado abaixo de seu valor residual. Ao atingir o valor residual, novas depreciações deverão ser interrompidas até que o patrimônio seja reavaliado.

### RN03: Reavaliação após o limite de depreciação

**Descrição:** Quando um item patrimonial atingir seu valor residual, ele deverá ser reavaliado para que novos parâmetros patrimoniais e de depreciação possam ser definidos.

### RN04: Preservação de itens patrimoniais baixados

**Descrição:** Um item patrimonial baixado deverá permanecer armazenado no sistema para preservação de seu histórico, não podendo ser excluído definitivamente.

### RN05: Irreversibilidade da baixa patrimonial

**Descrição:** Após a baixa de um item patrimonial, ele não poderá retornar à situação de ativo.

### RN06: Valor mínimo de incorporação

**Descrição:** Um item patrimonial não poderá ser cadastrado com valor de incorporação igual ou menor que zero.

### RN07: Unicidade do número patrimonial e do número de série

**Descrição:** Cada número patrimonial e série deverá identificar um único item patrimonial, não podendo existir dois patrimônios com o mesmo número.

### RN08: Vinculação obrigatória do patrimônio a um setor

**Descrição:** Todo item patrimonial deverá estar vinculado a um setor, sendo o responsável pelo setor considerado também responsável pelos patrimônios nele localizados.

### RN09: Transferência patrimonial exclusiva entre setores

**Descrição:** A transferência de patrimônios deverá ocorrer entre setores, não sendo permitida a transferência direta entre responsáveis.

### RN10: Restrição de transferência de patrimônio baixado

**Descrição:** Um patrimônio com situação BAIXADO não poderá ser transferido para outro setor.

### RN11: Comissão vigente para operações patrimoniais

**Descrição:** As operações patrimoniais que exigirem comissão somente poderão ser realizadas quando houver uma comissão vigente associada à operação.

### RN12: Alteração dos parâmetros de depreciação por reavaliação

**Descrição:** Os parâmetros de depreciação de um patrimônio não poderão ser alterados diretamente. Qualquer alteração desses parâmetros deverá ocorrer por meio de uma reavaliação.

### RN13: Reavaliação restrita a patrimônios não baixados

**Descrição:** Patrimônios baixados não poderão ser submetidos a reavaliação.

### RN14: Depreciação restrita a patrimônios não baixados

**Descrição:** Patrimônios baixados não poderão sofrer novos processos de depreciação.

### RN15: Empréstimo e baixas são restritos a patrimônios ativos

**Descrição:** Somente patrimônios com situação ATIVO poderão ser emprestados ou Baixados.

### RN16: Classificação patrimonial por espécie

**Descrição:** Todo patrimônio deverá possuir uma única espécie, e sua natureza será determinada pela natureza vinculada a essa espécie.

### RN17: Vinculação única entre espécie e natureza

**Descrição:** Cada espécie de bem deverá estar vinculada a uma única natureza.

### RN18: Responsável obrigatório por setor

**Descrição:** Todo setor deverá possuir um responsável definido.

### RN19: Restrição de operações em setores inativos

**Descrição:** Setores inativos não poderão receber novos patrimônios, ser utilizados como destino de transferências ou participar de novos inventários.

## Casos de Uso

### UC01 - Autenticar e controlar acesso

**Ator(es):** Usuário do sistema

**Pré-condição:** O usuário deve estar cadastrado e ativo.

**Fluxo principal:**

1. O usuário acessa a tela de autenticação.
2. O usuário informa e-mail e senha.
3. O sistema valida as credenciais.
4. O sistema identifica o tipo de usuário e suas permissões.
5. O sistema libera o acesso às funcionalidades autorizadas.

**Fluxos alternativos / exceções:**

- Credenciais inválidas: o sistema informa o erro e não cria sessão.
- Usuário inativo: o sistema bloqueia o acesso.
- Tentativa de acessar função sem permissão: o sistema nega a operação.
- Alteração autenticada: o usuário informa a senha atual, a nova senha e sua
  confirmação; o sistema valida os dados, altera somente a senha da identidade
  autenticada e revoga suas sessões.
- Senha atual inválida: o sistema rejeita a alteração sem modificar a conta.
- Esquecimento de senha: o usuário informa o e-mail e recebe uma resposta
  neutra; quando houver uma conta ativa, o sistema envia ao e-mail cadastrado
  um link temporário e de uso único.
- Redefinição: o usuário apresenta o token recebido, a nova senha e sua
  confirmação; o sistema consome o token, altera a senha e revoga as sessões.
- Token ausente, inválido, expirado, consumido ou pertencente a usuário
  inativo: o sistema rejeita a redefinição com a mesma resposta pública.
- Solicitação para e-mail inexistente ou de usuário inativo: o sistema mantém a
  mesma resposta apresentada para uma conta elegível e não altera nenhum
  usuário.

**Pós-condição:** Após o login, o usuário permanece autenticado com as
permissões correspondentes ao seu perfil. Após alteração ou redefinição de
senha, suas sessões anteriores deixam de autenticar e um novo login é exigido.

**Requisito relacionado:** RF01

### UC02 - Gerenciar usuários

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado e possuir permissão de gestão de usuários.

**Fluxo principal:**

1. O Administrador acessa a gestão de usuários.
2. O sistema lista os usuários cadastrados.
3. O Administrador escolhe cadastrar, alterar, ativar ou inativar um usuário.
4. O sistema valida os dados informados.
5. O sistema grava a operação e registra as informações de auditoria.

**Fluxos alternativos / exceções:**

- E-mail já utilizado: o sistema rejeita o cadastro ou a alteração.
- Dados obrigatórios ausentes: o sistema informa os campos inválidos.

**Pós-condição:** O cadastro de usuário é criado ou atualizado sem perda do histórico relacionado.

**Requisito relacionado:** RF02

### UC03 - Gerenciar responsáveis

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado.

**Fluxo principal:**

1. O Administrador acessa a gestão de responsáveis.
2. O sistema lista os responsáveis.
3. O Administrador cadastra, altera ou inativa um responsável.
4. O sistema valida a matrícula e os dados obrigatórios.
5. O sistema salva a alteração.

**Fluxos alternativos / exceções:**

- Responsável já vinculado a históricos: a inativação mantém os vínculos anteriores.
- Matrícula inválida ou ausente: o sistema bloqueia a gravação.

**Pós-condição:** O responsável é mantido atualizado e disponível para vínculos permitidos.

**Requisito relacionado:** RF03

### UC04 - Gerenciar setores

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado e existir pelo menos um responsável ativo para novos cadastros.

**Fluxo principal:**

1. O Administrador acessa a gestão de setores.
2. O sistema lista os setores.
3. O Administrador cria ou altera o setor e seleciona seu responsável.
4. O sistema valida os dados.
5. O sistema salva o setor ou altera sua situação.

**Fluxos alternativos / exceções:**

- Tentativa de cadastrar setor sem responsável: o sistema rejeita a operação.
- Setor inativado: o sistema impede seu uso em novos vínculos e movimentações.

**Pós-condição:** O setor permanece disponível conforme sua situação e com um responsável definido.

**Requisito relacionado:** RF04

### UC05 - Gerenciar comissões

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado e existir responsáveis cadastrados.

**Fluxo principal:**

1. O Administrador acessa a gestão de comissões.
2. O Administrador informa identificação, número do ato, quando houver, e período de vigência.
3. O Administrador pode selecionar até 50 responsáveis ativos como integrantes ou prosseguir sem integrantes.
4. Para cada integrante selecionado, o Administrador define o papel como PRESIDENTE ou MEMBRO, sem repetir responsável nem definir mais de um presidente.
5. O sistema valida e salva a comissão.

**Fluxos alternativos / exceções:**

- Datas de vigência inválidas: o sistema solicita correção.
- Integrante indisponível para vínculo: o sistema impede a operação.
- Responsável repetido ou segundo presidente: o sistema impede a operação.
- Comissão já utilizada em operação patrimonial: o sistema permite alterar somente nome e descrição.

**Pós-condição:** A comissão fica disponível para seleção nas operações patrimoniais durante sua vigência.

**Requisito relacionado:** RF05

### UC06 - Gerenciar naturezas

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado.

**Fluxo principal:**

1. O Administrador acessa a gestão de naturezas.
2. O Administrador informa o nome da natureza.
3. O sistema gera o nome normalizado.
4. O sistema verifica duplicidade.
5. O sistema salva a natureza.

**Fluxos alternativos / exceções:**

- Nome normalizado já existente: o sistema informa que a natureza já está cadastrada.

**Pós-condição:** A natureza fica disponível para vinculação às espécies.

**Requisito relacionado:** RF06

### UC07 - Gerenciar espécies

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado e existir ao menos uma natureza cadastrada.

**Fluxo principal:**

1. O Administrador acessa a gestão de espécies.
2. O Administrador informa o nome da espécie.
3. O Administrador seleciona a natureza correspondente.
4. O sistema normaliza o nome e verifica duplicidade.
5. O sistema salva a espécie.

**Fluxos alternativos / exceções:**

- Nome normalizado já existente: o sistema rejeita o cadastro.
- Natureza não informada: o sistema impede a gravação.

**Pós-condição:** A espécie fica cadastrada e vinculada a uma única natureza.

**Requisito relacionado:** RF07

### UC08 - Gerenciar fornecedores

**Ator(es):** Administrador

**Pré-condição:** O Administrador deve estar autenticado.

**Fluxo principal:**

1. O Administrador acessa a gestão de fornecedores.
2. O sistema lista os fornecedores.
3. O Administrador cadastra ou altera os dados do fornecedor.
4. O sistema valida os dados obrigatórios.
5. O sistema salva a operação.

**Fluxos alternativos / exceções:**

- Fornecedor já utilizado em registros históricos: o sistema preserva o vínculo mesmo que posteriormente fique inativo.

**Pós-condição:** O fornecedor fica disponível para os processos que aceitam sua vinculação.

**Requisito relacionado:** RF08

### UC09 - Registrar processo de compra

**Ator(es):** Administrador e Diretor de Patrimônio

**Pré-condição:** O usuário deve estar autenticado e possuir permissão sobre o cadastro de aquisição.

**Fluxo principal:**

1. O usuário cria um processo de compra.
2. O usuário informa os dados da compra.
3. O usuário cria e vincula os registros de notas fiscais correspondentes.
4. O sistema salva o registro e os relacionamentos.

**Fluxos alternativos / exceções:**

- O mesmo número de empenho pode existir em mais de um registro conforme o processo institucional.
- Itens de consumo não patrimoniados não são cadastrados como patrimônio pelo sistema.

**Pós-condição:** O processo de compra fica registrado com documentos fiscais vinculados.

**Requisito relacionado:** RF09

### UC10 - Cadastrar patrimônio

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado; devem existir setor, espécie e demais cadastros obrigatórios.

**Fluxo principal:**

1. O Diretor acessa o cadastro de patrimônio.
2. O Diretor informa os dados do bem e marca se ele não possui número patrimonial oficial.
3. O Diretor seleciona setor, espécie e processo de compra.
4. O Diretor informa os dados dos parâmetros de depreciação.
5. O sistema normaliza os campos de busca, valida unicidades e gera o próximo identificador da sequência oficial ou `SP-`, conforme a marcação.
6. O sistema salva o patrimônio com status inicial ATIVO e associa o identificador gerado.

**Fluxos alternativos / exceções:**

- Conflito inesperado na geração do identificador: o sistema não cria parcialmente o patrimônio e retorna erro previsível.
- Número de série já existente: o sistema rejeita o cadastro.
- Valor igual ou menor que zero: o sistema rejeita o cadastro.
- Dados obrigatórios ausentes: o sistema rejeita o cadastro.

**Pós-condição:** O patrimônio é criado e passa a integrar o acervo do setor selecionado.

**Requisito relacionado:** RF10

### UC11 - Consultar e filtrar patrimônios

**Ator(es):** Administrador e Diretor de Patrimônio

**Pré-condição:** O usuário deve estar autenticado.

**Fluxo principal:**

1. O usuário acessa a listagem de patrimônios.
2. O usuário informa um texto de busca e/ou seleciona filtros.
3. O sistema consulta os campos normalizados e os demais filtros.
4. O sistema apresenta a lista resultante.
5. O usuário pode abrir os detalhes de um patrimônio.

**Fluxos alternativos / exceções:**

- Nenhum resultado encontrado: o sistema apresenta lista vazia sem alterar dados.

**Pós-condição:** O usuário visualiza os patrimônios compatíveis com os critérios informados.

**Requisito relacionado:** RF11

### UC12 - Alterar número patrimonial

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado e o patrimônio deve possuir número patrimonial substituível.

**Fluxo principal:**

1. O Diretor localiza o patrimônio.
2. O Diretor solicita a troca do número patrimonial.
3. O Diretor confirma o número atual apresentado pelo sistema.
4. O sistema valida que o identificador atual pertence à sequência oficial e ainda corresponde ao patrimônio.
5. O sistema gera o próximo número da sequência numérica oficial.
6. O sistema atualiza o número e registra a substituição de forma atômica.

**Fluxos alternativos / exceções:**

- Bem identificado pelo padrão `SP-`: o sistema informa que esse fluxo não se aplica.
- Número atual informado não corresponde mais ao patrimônio: o sistema rejeita a repetição ou atualização concorrente.
- Novo número conflita com registro existente: o sistema não conclui a alteração nem grava histórico parcial.

**Pós-condição:** O patrimônio passa a ser identificado pelo novo número patrimonial.

**Requisito relacionado:** RF12

### UC13 - Transferir patrimônios entre setores

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado; deve existir comissão vigente quando exigida e setores ativos disponíveis.

**Fluxo principal:**

1. O Diretor inicia uma transferência.
2. O Diretor seleciona a comissão vigente quando aplicável.
3. O Diretor seleciona um ou mais patrimônios.
4. O Diretor define o setor de destino de cada item.
5. O sistema valida a situação dos bens e dos setores.
6. O Diretor confirma a operação.
7. O sistema atualiza os setores e cria os históricos de transferência.

**Fluxos alternativos / exceções:**

- Patrimônio baixado: o sistema bloqueia o item.
- Setor de destino inativo: o sistema rejeita o destino.
- Comissão obrigatória inexistente ou fora da vigência: o sistema não permite concluir.

**Pós-condição:** Os patrimônios passam a pertencer aos setores de destino e ficam com histórico da movimentação.

**Requisito relacionado:** RF13

### UC14 - Reavaliar patrimônios

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado; os bens não podem estar baixados e deve existir comissão vigente quando exigida.

**Fluxo principal:**

1. O Diretor inicia uma reavaliação.
2. O Diretor seleciona a comissão e um ou mais patrimônios.
3. O Diretor informa, para cada bem, novo valor, nova vida útil e valor ou percentual residual.
4. O sistema encerra o parâmetro de depreciação vigente.
5. O sistema cria o novo parâmetro e atualiza a situação patrimonial.
6. O sistema grava o histórico individual de reavaliação.

**Fluxos alternativos / exceções:**

- Patrimônio baixado: o sistema bloqueia a reavaliação.
- Valores ou parâmetros inválidos: o sistema solicita correção.

**Pós-condição:** Cada patrimônio possui novos parâmetros de depreciação e registro histórico de reavaliação.

**Requisito relacionado:** RF14

### UC15 - Executar depreciação automática

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado; deve existir patrimônios com parâmetros de depreciação vigentes.

**Fluxo principal:**

1. O Diretor inicia o processo de depreciação automática.
2. O sistema identifica os patrimônios elegíveis.
3. O sistema calcula, para cada patrimônio, o valor depreciável do período de acordo com o método.
4. O sistema soma o valor calculado ao acumulado de depreciação.
5. O sistema registra o histórico do processamento.

**Fluxos alternativos / exceções:**

- Patrimônio baixado: o item é ignorado.
- Patrimônio sem parâmetros válidos: o item não é depreciado.
- Valor residual alcançado: o sistema não reduz o valor além do limite e informa ao usuário que há bens que chegaram ao valor residual.

**Pós-condição:** A situação patrimonial é atualizada e o processamento fica registrado no histórico.

**Requisito relacionado:** RF15

### UC16 - Registrar empréstimo e devolução

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado e os patrimônios selecionados devem estar ATIVOS.

**Fluxo principal:**

1. O Diretor inicia um empréstimo.
2. O Diretor seleciona um ou mais patrimônios.
3. O Diretor informa o destinatário externo, a finalidade e a previsão de devolução.
4. O sistema cria registros individuais e um identificador de agrupamento quando necessário e altera o status dos patrimônios para EMPRESTADO.
5. Na devolução, o Diretor localiza o registro, informa a data e confirma o retorno.
6. O sistema registra a devolução e atualiza o status do bem para ATIVO.

**Fluxos alternativos / exceções:**

- Patrimônio não ativo: o sistema impede o empréstimo.
- Tentativa de renovar empréstimo: o sistema não oferece renovação no fluxo atual.
- Dados de devolução inconsistentes: o sistema solicita correção.

**Pós-condição:** O empréstimo e a devolução ficam registrados de forma rastreável por patrimônio.

**Requisito relacionado:** RF16

### UC17 - Baixar patrimônio

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado e o patrimônio deve estar ATIVO.

**Fluxo principal:**

1. O Diretor localiza o patrimônio e inicia a baixa.
2. O Diretor informa tipo, motivo, data, observação opcional e anexa um PDF
   comprobatório quando existente.
3. O Diretor seleciona a comissão responsável pela baixa.
4. O sistema valida a situação do bem.
5. O Diretor confirma a baixa.
6. O sistema altera o status para BAIXADO e grava o histórico.

**Fluxos alternativos / exceções:**

- Patrimônio não ativo: o sistema impede a baixa.
- Patrimônio incluído em inventário não finalizado: o sistema impede a baixa.
- Comissão inexistente ou sem vigência na data da baixa: o sistema rejeita a
  operação.
- Data futura: o sistema solicita correção.
- Documento inválido ou dados obrigatórios ausentes: o sistema solicita correção.

**Pós-condição:** O patrimônio permanece registrado no sistema, porém com status BAIXADO e histórico preservado.

**Requisito relacionado:** RF17

### UC18 - Gerenciar manutenção de patrimônios

**Ator(es):** Administrador e Diretor de Patrimônio

**Pré-condição:** O usuário deve estar autenticado e possuir permissão para gerenciar manutenções.

**Fluxo principal:**

1. O usuário cria uma manutenção e seleciona os patrimônios enviados.
2. O sistema cria os itens de manutenção e atualiza a situação dos bens.
3. O usuário registra ou atualiza o orçamento individual de cada item, informando o fornecedor.
4. Ao receber os itens, o usuário registra descrição, valor, garantia e documentos.
5. O sistema atualiza a manutenção e a situação dos patrimônios recebidos.

**Fluxos alternativos / exceções:**

- Orçamento ainda não definido: o item pode permanecer em aberto até atualização.
- Documento inválido: o sistema rejeita o anexo.

**Pós-condição:** A manutenção e seus itens permanecem registrados com orçamento, serviço, valores, garantia e histórico de recebimento.

**Requisito relacionado:** RF18

### UC19 - Realizar inventário patrimonial

**Ator(es):** Diretor de Patrimônio

**Pré-condição:** O Diretor deve estar autenticado; os setores e patrimônios a
incluir devem estar ativos e a comissão deve estar vigente.

**Fluxo principal:**

1. O Diretor cadastra um inventário sob uma comissão vigente.
2. O sistema cria os setores do inventário para todos os setores ativos e os
   itens pendentes para todos os patrimônios ativos, preservando o setor esperado.
3. O Diretor inicia um setor; o sistema impede outro setor simultâneo e bloqueia
   operações incompatíveis com a conferência em andamento.
4. O Diretor identifica cada bem por leitura da etiqueta ou busca manual.
5. O sistema compara o setor da conferência com o setor esperado, registrando
   CORRETO ou DIVERGENCIA e consolidando cada patrimônio uma única vez.
6. O Diretor pode corrigir a divergência imediatamente ou deixá-la pendente.
7. Ao concluir o setor, o sistema marca como NAO_LOCALIZADO cada item ainda
   pendente daquele setor e libera as operações bloqueadas.
8. Depois de concluir todos os setores, o Diretor finaliza o inventário, com
   confirmação explícita caso existam correções pendentes.

**Fluxos alternativos / exceções:**

- Etiqueta ilegível: o usuário utiliza busca manual.
- Patrimônio localizado em outro setor: o sistema registra divergência.
- Correção imediata: o sistema cria a transferência e vincula a correção ao item de inventário.
- Correção posterior: a divergência permanece pendente.
- Leitura repetida no mesmo setor: o sistema devolve o resultado existente sem
  nova gravação.
- Patrimônio já verificado em outro setor: o sistema rejeita a nova conferência,
  informa o resultado anterior e diferencia transferência posterior de
  movimentação física não registrada.
- Início concorrente de setores: somente uma operação vence; as demais recebem
  conflito estável indicando o setor já em andamento.

**Pós-condição:** O inventário fica finalizado e imutável, com os bens
conferidos, itens não localizados, divergências e correções rastreáveis.

**Requisito relacionado:** RF19

### UC20 - Consultar histórico patrimonial

**Ator(es):** Administrador e Diretor de Patrimônio

**Pré-condição:** O usuário deve estar autenticado e existir patrimônio cadastrado.

**Fluxo principal:**

1. O usuário localiza o patrimônio.
2. O usuário acessa a opção de histórico.
3. O sistema reúne os eventos históricos do bem.
4. O sistema apresenta os eventos em ordem cronológica, com data e responsável.
5. O usuário abre os detalhes de um evento específico quando necessário.

**Fluxos alternativos / exceções:**

- Patrimônio sem determinado tipo de evento: a seção correspondente é apresentada sem registros.

**Pós-condição:** O usuário obtém uma visão rastreável do ciclo de vida do patrimônio.

**Requisito relacionado:** RF20

### UC21 - Gerar relatórios patrimoniais

**Ator(es):** Administrador e Diretor de Patrimônio

**Pré-condição:** O usuário deve estar autenticado e possuir acesso aos dados consultados.

**Fluxo principal:**

1. O usuário acessa o módulo de relatórios.
2. O usuário seleciona o tipo de relatório e os filtros disponíveis.
3. O sistema consulta os cadastros e históricos patrimoniais.
4. O sistema apresenta o resultado consolidado.
5. O usuário visualiza ou exporta o relatório em formato de PDF.

**Fluxos alternativos / exceções:**

- Filtros sem resultados: o sistema retorna relatório sem registros.
- Parâmetros inválidos: o sistema solicita correção.

**Pós-condição:** O relatório patrimonial é gerado com base nos dados atuais e históricos preservados pelo sistema.

**Requisito relacionado:** RF21

## Matriz de Rastreabilidade

| Requisito Funcional | Regra(s) de Negócio relacionada(s) | Caso de Uso relacionado |
| ------------------- | ---------------------------------- | ----------------------- |
| RF01                | -                                  | UC01                    |
| RF02                | -                                  | UC02                    |
| RF03                | -                                  | UC03                    |
| RF04                | RN18, RN19                         | UC04                    |
| RF05                | RN11                               | UC05                    |
| RF06                | -                                  | UC06                    |
| RF07                | RN16, RN17                         | UC07                    |
| RF08                | -                                  | UC08                    |
| RF09                | -                                  | UC09                    |
| RF10                | RN06, RN07, RN08, RN16, RN18, RN19 | UC10                    |
| RF11                | -                                  | UC11                    |
| RF12                | RN01, RN07                         | UC12                    |
| RF13                | RN01, RN09, RN10, RN11, RN19       | UC13                    |
| RF14                | RN01, RN03, RN11, RN12, RN13       | UC14                    |
| RF15                | RN01, RN02, RN03, RN14             | UC15                    |
| RF16                | RN01, RN11, RN15                   | UC16                    |
| RF17                | RN01, RN04, RN05, RN11, RN15       | UC17                    |
| RF18                | RN01, RN11                         | UC18                    |
| RF19                | RN08, RN09, RN11, RN19             | UC19                    |
| RF20                | RN04                               | UC20                    |
| RF21                | RN04                               | UC21                    |

## Papéis de Usuários

### Administrador do Sistema

**Atributos:** E-mail, senha, nome, perfil e situação do usuário.

**Eventos:** Administrar os cadastros administrativos do sistema, incluindo usuários, responsáveis, setores, comissões, naturezas de bens, espécies de bens e fornecedores. Também poderá participar do registro e alteração de processos de compra e do gerenciamento de manutenções.

**Serviços:** Autenticação e controle de acesso (RF01); Gestão de Usuários (RF02); Gestão de Responsáveis (RF03); Gestão de Setores (RF04); Gestão de Comissões (RF05); Gestão de Naturezas de Bens (RF06); Gestão de Espécies de Bens (RF07); Gestão de Fornecedores (RF08); Gestão de Processos de Compra e Documentos Fiscais (RF09); Gestão de Manutenções (RF18); Consulta de Patrimônios (RF11); Consulta do Histórico Patrimonial (RF20); Relatórios Patrimoniais (RF21).

**Subpontos de vista:** Diretor de Patrimônio, Usuário do Sistema.

### Diretor de Patrimônio

**Atributos:** E-mail, senha, nome, perfil e situação do usuário.

**Eventos:** Realizar as operações relacionadas ao gerenciamento dos bens patrimoniais, incluindo cadastro, consulta, movimentação, reavaliação, depreciação, empréstimo, baixa, manutenção, inventário e acompanhamento do histórico dos patrimônios. Também poderá registrar e alterar processos de compra e consultar informações patrimoniais e relatórios.

**Serviços:** Autenticação e controle de acesso (RF01); Gestão de Processos de Compra e Documentos Fiscais (RF09); Cadastro de Patrimônios (RF10); Consulta, Listagem e Filtros de Patrimônios (RF11); Alteração do Número Patrimonial (RF12); Transferência de Patrimônios (RF13); Reavaliação de Patrimônios (RF14); Depreciação Automática de Patrimônios (RF15); Empréstimo e Devolução de Patrimônios (RF16); Baixa de Patrimônios (RF17); Gestão de Manutenções (RF18); Inventário Patrimonial (RF19); Consulta do Histórico Patrimonial (RF20); Relatórios Patrimoniais (RF21).

**Subpontos de vista:** Administrador do Sistema, Usuário do Sistema.

### Usuário do Sistema

**Atributos:** E-mail, senha, nome, perfil e situação do usuário.

**Eventos:** Autenticar-se no sistema e acessar as funcionalidades disponíveis de acordo com o perfil e as permissões atribuídas.

**Serviços:** Autenticação e controle de acesso (RF01).

**Subpontos de vista:** Administrador do Sistema, Diretor de Patrimônio.
