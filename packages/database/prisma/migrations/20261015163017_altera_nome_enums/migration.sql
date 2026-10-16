/*
  Warnings:

  - The `status` column on the `inventarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `situacao` column on the `itens_inventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status_verificacao` column on the `itens_inventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status_correcao` column on the `itens_inventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo_correcao` column on the `itens_inventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `manutencoes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo_membro_comissao` column on the `membros_comissao` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo_incorporacao` column on the `patrimonios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `patrimonios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `setores_inventario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `tipo` on the `baixas_patrimoniais` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tipo` on the `manutencoes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `metodo` on the `parametros_depreciacao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `perfil` on the `usuarios` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMINISTRADOR', 'DIRETOR_PATRIMONIO');

-- CreateEnum
CREATE TYPE "TipoMembroComissao" AS ENUM ('PRESIDENTE', 'MEMBRO');

-- CreateEnum
CREATE TYPE "TipoIncorporacao" AS ENUM ('AQUISICAO', 'DOACAO', 'TRANSFERENCIA', 'CESSAO', 'COMODATO', 'PERMUTA', 'PRODUCAO_INTERNA', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusPatrimonio" AS ENUM ('ATIVO', 'BAIXADO', 'EMPRESTADO', 'EM_MANUTENCAO');

-- CreateEnum
CREATE TYPE "TipoBaixa" AS ENUM ('ALIENACAO', 'INVERSIBILIDADE', 'PERDA_FISICA', 'AJUSTE_CONTABIL');

-- CreateEnum
CREATE TYPE "TipoManutencao" AS ENUM ('PREVENTIVA', 'CORRETIVA');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "StatusInventario" AS ENUM ('FINALIZADO', 'PENDENTE', 'EM_ANDAMENTO');

-- CreateEnum
CREATE TYPE "StatusSetorInventario" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "SituacaoItemInventario" AS ENUM ('DIVERGENCIA', 'CORRETO', 'NAO_LOCALIZADO');

-- CreateEnum
CREATE TYPE "StatusVerificacaoItemInventario" AS ENUM ('VERIFICADO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "StatusCorrecaoItemInventario" AS ENUM ('CORRIGIDO', 'PENDENTE');

-- CreateEnum
CREATE TYPE "TipoCorrecaoItemInventario" AS ENUM ('TRANSFERENCIA_CADASTRAL', 'RETORNO_AO_SETOR_CADASTRADO');

-- CreateEnum
CREATE TYPE "MetodoDepreciacao" AS ENUM ('LINEAR');

-- AlterTable
ALTER TABLE "baixas_patrimoniais" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoBaixa" NOT NULL;

-- AlterTable
ALTER TABLE "inventarios" DROP COLUMN "status",
ADD COLUMN     "status" "StatusInventario" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "itens_inventario" DROP COLUMN "situacao",
ADD COLUMN     "situacao" "SituacaoItemInventario",
DROP COLUMN "status_verificacao",
ADD COLUMN     "status_verificacao" "StatusVerificacaoItemInventario" NOT NULL DEFAULT 'PENDENTE',
DROP COLUMN "status_correcao",
ADD COLUMN     "status_correcao" "StatusCorrecaoItemInventario",
DROP COLUMN "tipo_correcao",
ADD COLUMN     "tipo_correcao" "TipoCorrecaoItemInventario";

-- AlterTable
ALTER TABLE "manutencoes" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoManutencao" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusManutencao" NOT NULL DEFAULT 'EM_ANDAMENTO';

-- AlterTable
ALTER TABLE "membros_comissao" DROP COLUMN "tipo_membro_comissao",
ADD COLUMN     "tipo_membro_comissao" "TipoMembroComissao";

-- AlterTable
ALTER TABLE "parametros_depreciacao" DROP COLUMN "metodo",
ADD COLUMN     "metodo" "MetodoDepreciacao" NOT NULL;

-- AlterTable
ALTER TABLE "patrimonios" DROP COLUMN "tipo_incorporacao",
ADD COLUMN     "tipo_incorporacao" "TipoIncorporacao" NOT NULL DEFAULT 'AQUISICAO',
DROP COLUMN "status",
ADD COLUMN     "status" "StatusPatrimonio" NOT NULL DEFAULT 'ATIVO';

-- AlterTable
ALTER TABLE "setores_inventario" DROP COLUMN "status",
ADD COLUMN     "status" "StatusSetorInventario" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "perfil",
ADD COLUMN     "perfil" "PerfilUsuario" NOT NULL;

-- DropEnum
DROP TYPE "metodo_depreciacao";

-- DropEnum
DROP TYPE "perfil_usuario";

-- DropEnum
DROP TYPE "situacao_item_inventario";

-- DropEnum
DROP TYPE "status_correcao_item_inventario";

-- DropEnum
DROP TYPE "status_inventario";

-- DropEnum
DROP TYPE "status_manutencao";

-- DropEnum
DROP TYPE "status_patrimonio";

-- DropEnum
DROP TYPE "status_setor_inventario";

-- DropEnum
DROP TYPE "status_verificacao_item_inventario";

-- DropEnum
DROP TYPE "tipo_baixa";

-- DropEnum
DROP TYPE "tipo_correcao_item_inventario";

-- DropEnum
DROP TYPE "tipo_incorporacao";

-- DropEnum
DROP TYPE "tipo_manutencao";

-- DropEnum
DROP TYPE "tipo_membro_comissao";
