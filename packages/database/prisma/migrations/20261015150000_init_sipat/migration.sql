-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "perfil_usuario" AS ENUM ('ADMINISTRADOR', 'DIRETOR_PATRIMONIO');

-- CreateEnum
CREATE TYPE "tipo_membro_comissao" AS ENUM ('PRESIDENTE', 'MEMBRO');

-- CreateEnum
CREATE TYPE "tipo_incorporacao" AS ENUM ('AQUISICAO', 'DOACAO', 'TRANSFERENCIA', 'CESSAO', 'COMODATO', 'PERMUTA', 'PRODUCAO_INTERNA', 'OUTROS');

-- CreateEnum
CREATE TYPE "status_patrimonio" AS ENUM ('ATIVO', 'BAIXADO', 'EMPRESTADO', 'EM_MANUTENCAO');

-- CreateEnum
CREATE TYPE "tipo_baixa" AS ENUM ('ALIENACAO', 'INVERSIBILIDADE', 'PERDA_FISICA', 'AJUSTE_CONTABIL');

-- CreateEnum
CREATE TYPE "tipo_manutencao" AS ENUM ('PREVENTIVA', 'CORRETIVA');

-- CreateEnum
CREATE TYPE "status_manutencao" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "status_inventario" AS ENUM ('FINALIZADO', 'PENDENTE', 'EM_ANDAMENTO');

-- CreateEnum
CREATE TYPE "status_setor_inventario" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "situacao_item_inventario" AS ENUM ('DIVERGENCIA', 'CORRETO', 'NAO_LOCALIZADO');

-- CreateEnum
CREATE TYPE "status_verificacao_item_inventario" AS ENUM ('VERIFICADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "status_correcao_item_inventario" AS ENUM ('CORRIGIDO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "tipo_correcao_item_inventario" AS ENUM ('TRANSFERENCIA_CADASTRAL', 'RETORNO_AO_SETOR_CADASTRADO');

-- CreateEnum
CREATE TYPE "metodo_depreciacao" AS ENUM ('LINEAR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" "perfil_usuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "matricula" VARCHAR(20) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "naturezas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "nome_normalizado" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "naturezas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especies" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "nome_normalizado" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "natureza_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "especies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos_compra" (
    "id" UUID NOT NULL,
    "numero_processo" VARCHAR(50),
    "ano_processo" SMALLINT,
    "numero_empenho" VARCHAR(50),
    "ano_empenho" SMALLINT,
    "valor_total" DECIMAL(19,7),
    "observacao" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "processos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "sala" VARCHAR(50),
    "ramal" VARCHAR(10),
    "responsavel_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" UUID NOT NULL,
    "razao_social" VARCHAR(150) NOT NULL,
    "nome_fantasia" VARCHAR(150),
    "nome_representante" VARCHAR(150),
    "cnpj" VARCHAR(20),
    "email" VARCHAR(150),
    "telefone" VARCHAR(30),
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "numero_ato" DATE,
    "data_vigencia_inicio" DATE NOT NULL,
    "data_vigencia_fim" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_comissao" (
    "id" UUID NOT NULL,
    "tipo_membro_comissao" "tipo_membro_comissao",
    "comissao_id" UUID NOT NULL,
    "responsavel_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "membros_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" UUID NOT NULL,
    "numero_nota_fiscal" VARCHAR(50) NOT NULL,
    "ano_nota_fiscal" SMALLINT NOT NULL,
    "data_emissao" DATE NOT NULL,
    "caminho_anexo_nota_fiscal" VARCHAR(500),
    "processo_compra_id" UUID NOT NULL,
    "fornecedor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrimonios" (
    "id" UUID NOT NULL,
    "numero_patrimonio" VARCHAR(50) NOT NULL,
    "descricao" TEXT NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "numero_serie" VARCHAR(100),
    "texto_busca" TEXT,
    "tipo_incorporacao" "tipo_incorporacao" NOT NULL DEFAULT 'AQUISICAO',
    "data_tombamento" DATE NOT NULL,
    "valor_incorporacao" DECIMAL(19,7) NOT NULL,
    "status" "status_patrimonio" NOT NULL DEFAULT 'ATIVO',
    "especie_id" UUID NOT NULL,
    "setor_atual_id" UUID NOT NULL,
    "processo_compra_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "patrimonios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_patrimoniais" (
    "id" UUID NOT NULL,
    "data_transferencia" TIMESTAMP(6) NOT NULL,
    "observacao" TEXT,
    "setor_antigo_id" UUID NOT NULL,
    "setor_atual_id" UUID NOT NULL,
    "patrimonio_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "transferencias_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos_patrimoniais" (
    "id" UUID NOT NULL,
    "data_emprestimo" TIMESTAMP(6) NOT NULL,
    "data_prevista_devolucao" TIMESTAMP(6),
    "destinatario" VARCHAR(200),
    "finalidade" TEXT,
    "observacao" TEXT,
    "grupo_emprestimo_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "patrimonio_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "emprestimos_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucoes_patrimoniais" (
    "id" UUID NOT NULL,
    "data_devolucao" TIMESTAMP(6) NOT NULL,
    "observacao" TEXT,
    "emprestimo_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolucoes_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" UUID NOT NULL,
    "numero_requisicao" VARCHAR(50),
    "numero_empenho" VARCHAR(50),
    "ano_empenho" SMALLINT,
    "tipo" "tipo_manutencao" NOT NULL,
    "justificativa" TEXT,
    "data_empenho" DATE,
    "data_envio" DATE NOT NULL,
    "previsao_retorno" DATE,
    "data_retorno" DATE,
    "status" "status_manutencao" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacao" TEXT,
    "caminho_anexo_observacao" VARCHAR(500),
    "fornecedor_id" UUID,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_manutencao" (
    "id" UUID NOT NULL,
    "descricao_problema" TEXT,
    "data_orcamento" DATE,
    "descricao_orcamento" TEXT,
    "valor_orcamento" DECIMAL(19,7),
    "descricao_servico_realizado" TEXT,
    "valor_realizado" DECIMAL(19,7),
    "data_retorno" DATE,
    "observacao" TEXT,
    "caminho_anexo_observacao" VARCHAR(500),
    "manutencao_id" UUID NOT NULL,
    "patrimonio_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "itens_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "data_inicio" DATE,
    "data_fim" DATE,
    "status" "status_inventario" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores_inventario" (
    "id" UUID NOT NULL,
    "status" "status_setor_inventario" NOT NULL DEFAULT 'PENDENTE',
    "data_inicio" TIMESTAMP(6),
    "data_fim" TIMESTAMP(6),
    "inventario_id" UUID NOT NULL,
    "setor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "setores_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_inventario" (
    "id" UUID NOT NULL,
    "situacao" "situacao_item_inventario",
    "status_verificacao" "status_verificacao_item_inventario" NOT NULL DEFAULT 'PENDENTE',
    "data_verificacao" TIMESTAMP(6),
    "status_correcao" "status_correcao_item_inventario",
    "tipo_correcao" "tipo_correcao_item_inventario",
    "data_correcao" TIMESTAMP(6),
    "observacao" TEXT,
    "setor_esperado_id" UUID NOT NULL,
    "setor_encontrado_id" UUID,
    "patrimonio_id" UUID NOT NULL,
    "setor_inventario_id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "transferencia_correcao_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "itens_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baixas_patrimoniais" (
    "id" UUID NOT NULL,
    "data_baixa" TIMESTAMP(6) NOT NULL,
    "tipo" "tipo_baixa" NOT NULL,
    "motivo" TEXT NOT NULL,
    "observacao" TEXT,
    "caminho_anexo_documento" VARCHAR(500),
    "patrimonio_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "baixas_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situacoes_contabeis_patrimoniais" (
    "id" UUID NOT NULL,
    "valor_bruto_atual" DECIMAL(19,7) NOT NULL,
    "depreciacao_acumulada_atual" DECIMAL(19,7) NOT NULL DEFAULT 0,
    "patrimonio_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "situacoes_contabeis_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_depreciacao" (
    "id" UUID NOT NULL,
    "metodo" "metodo_depreciacao" NOT NULL,
    "vida_util_inicial_meses" INTEGER NOT NULL,
    "percentual_residual" DECIMAL(5,2),
    "valor_residual" DECIMAL(19,7) NOT NULL,
    "valor_base_inicial" DECIMAL(19,7) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "reavaliacao_id" UUID,
    "patrimonio_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "parametros_depreciacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciacoes_patrimoniais" (
    "id" UUID NOT NULL,
    "data_depreciacao" TIMESTAMP(6) NOT NULL,
    "data_competencia" DATE NOT NULL,
    "valor_contabil_anterior" DECIMAL(19,7) NOT NULL,
    "valor_depreciado" DECIMAL(19,7) NOT NULL,
    "valor_contabil_novo" DECIMAL(19,7) NOT NULL,
    "observacao" TEXT,
    "patrimonio_id" UUID NOT NULL,
    "parametro_depreciacao_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "depreciacoes_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reavaliacoes_patrimoniais" (
    "id" UUID NOT NULL,
    "data_reavaliacao" TIMESTAMP(6) NOT NULL,
    "valor_liquido_anterior" DECIMAL(19,7) NOT NULL,
    "valor_reavaliado" DECIMAL(19,7) NOT NULL,
    "valor_residual_anterior" DECIMAL(19,7) NOT NULL,
    "valor_residual_novo" DECIMAL(19,7) NOT NULL,
    "vida_util_restante_anterior_meses" INTEGER NOT NULL,
    "vida_util_nova_meses" INTEGER NOT NULL,
    "laudo_tecnico" TEXT,
    "observacao" TEXT,
    "patrimonio_id" UUID NOT NULL,
    "comissao_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "reavaliacoes_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "naturezas_nome_key" ON "naturezas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "naturezas_nome_normalizado_key" ON "naturezas"("nome_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "especies_nome_normalizado_key" ON "especies"("nome_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "membros_comissao_comissao_id_responsavel_id_key" ON "membros_comissao"("comissao_id", "responsavel_id");

-- CreateIndex
CREATE UNIQUE INDEX "patrimonios_numero_patrimonio_key" ON "patrimonios"("numero_patrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "patrimonios_numero_serie_key" ON "patrimonios"("numero_serie");

-- CreateIndex
CREATE UNIQUE INDEX "devolucoes_patrimoniais_emprestimo_id_key" ON "devolucoes_patrimoniais"("emprestimo_id");

-- CreateIndex
CREATE UNIQUE INDEX "setores_inventario_inventario_id_setor_id_key" ON "setores_inventario"("inventario_id", "setor_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_inventario_transferencia_correcao_id_key" ON "itens_inventario"("transferencia_correcao_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_inventario_inventario_id_patrimonio_id_key" ON "itens_inventario"("inventario_id", "patrimonio_id");

-- CreateIndex
CREATE UNIQUE INDEX "situacoes_contabeis_patrimoniais_patrimonio_id_key" ON "situacoes_contabeis_patrimoniais"("patrimonio_id");

-- CreateIndex
CREATE UNIQUE INDEX "parametros_depreciacao_reavaliacao_id_key" ON "parametros_depreciacao"("reavaliacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "depreciacoes_patrimoniais_patrimonio_id_parametro_depreciac_key" ON "depreciacoes_patrimoniais"("patrimonio_id", "parametro_depreciacao_id", "data_competencia");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "naturezas" ADD CONSTRAINT "naturezas_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especies" ADD CONSTRAINT "especies_natureza_id_fkey" FOREIGN KEY ("natureza_id") REFERENCES "naturezas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especies" ADD CONSTRAINT "especies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos_compra" ADD CONSTRAINT "processos_compra_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comissao" ADD CONSTRAINT "membros_comissao_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comissao" ADD CONSTRAINT "membros_comissao_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_processo_compra_id_fkey" FOREIGN KEY ("processo_compra_id") REFERENCES "processos_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonios" ADD CONSTRAINT "patrimonios_especie_id_fkey" FOREIGN KEY ("especie_id") REFERENCES "especies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonios" ADD CONSTRAINT "patrimonios_setor_atual_id_fkey" FOREIGN KEY ("setor_atual_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonios" ADD CONSTRAINT "patrimonios_processo_compra_id_fkey" FOREIGN KEY ("processo_compra_id") REFERENCES "processos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonios" ADD CONSTRAINT "patrimonios_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_patrimoniais" ADD CONSTRAINT "transferencias_patrimoniais_setor_antigo_id_fkey" FOREIGN KEY ("setor_antigo_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_patrimoniais" ADD CONSTRAINT "transferencias_patrimoniais_setor_atual_id_fkey" FOREIGN KEY ("setor_atual_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_patrimoniais" ADD CONSTRAINT "transferencias_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_patrimoniais" ADD CONSTRAINT "transferencias_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_patrimoniais" ADD CONSTRAINT "transferencias_patrimoniais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_patrimoniais" ADD CONSTRAINT "emprestimos_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_patrimoniais" ADD CONSTRAINT "emprestimos_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_patrimoniais" ADD CONSTRAINT "emprestimos_patrimoniais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucoes_patrimoniais" ADD CONSTRAINT "devolucoes_patrimoniais_emprestimo_id_fkey" FOREIGN KEY ("emprestimo_id") REFERENCES "emprestimos_patrimoniais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucoes_patrimoniais" ADD CONSTRAINT "devolucoes_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setores_inventario" ADD CONSTRAINT "setores_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setores_inventario" ADD CONSTRAINT "setores_inventario_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_setor_esperado_id_fkey" FOREIGN KEY ("setor_esperado_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_setor_encontrado_id_fkey" FOREIGN KEY ("setor_encontrado_id") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_setor_inventario_id_fkey" FOREIGN KEY ("setor_inventario_id") REFERENCES "setores_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_transferencia_correcao_id_fkey" FOREIGN KEY ("transferencia_correcao_id") REFERENCES "transferencias_patrimoniais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas_patrimoniais" ADD CONSTRAINT "baixas_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas_patrimoniais" ADD CONSTRAINT "baixas_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas_patrimoniais" ADD CONSTRAINT "baixas_patrimoniais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situacoes_contabeis_patrimoniais" ADD CONSTRAINT "situacoes_contabeis_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_depreciacao" ADD CONSTRAINT "parametros_depreciacao_reavaliacao_id_fkey" FOREIGN KEY ("reavaliacao_id") REFERENCES "reavaliacoes_patrimoniais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_depreciacao" ADD CONSTRAINT "parametros_depreciacao_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciacoes_patrimoniais" ADD CONSTRAINT "depreciacoes_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciacoes_patrimoniais" ADD CONSTRAINT "depreciacoes_patrimoniais_parametro_depreciacao_id_fkey" FOREIGN KEY ("parametro_depreciacao_id") REFERENCES "parametros_depreciacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciacoes_patrimoniais" ADD CONSTRAINT "depreciacoes_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciacoes_patrimoniais" ADD CONSTRAINT "depreciacoes_patrimoniais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reavaliacoes_patrimoniais" ADD CONSTRAINT "reavaliacoes_patrimoniais_patrimonio_id_fkey" FOREIGN KEY ("patrimonio_id") REFERENCES "patrimonios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reavaliacoes_patrimoniais" ADD CONSTRAINT "reavaliacoes_patrimoniais_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reavaliacoes_patrimoniais" ADD CONSTRAINT "reavaliacoes_patrimoniais_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
