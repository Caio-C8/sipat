import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../../common/database/database.module";
import { ArmazenamentoDocumentosModule } from "../../common/storage/armazenamento-documentos.module";
import { validateEnvironment } from "../../environment";
import { AuthModule } from "../../modules/auth/auth.module";
import { ComissoesModule } from "../../modules/comissoes/comissoes.module";
import { EspeciesModule } from "../../modules/especies/especies.module";
import { FornecedoresModule } from "../../modules/fornecedores/fornecedores.module";
import { InventariosModule } from "../../modules/inventarios/inventarios.module";
import { ManutencoesModule } from "../../modules/manutencoes/manutencoes.module";
import { NaturezasModule } from "../../modules/naturezas/naturezas.module";
import { PatrimoniosModule } from "../../modules/patrimonios/patrimonios.module";
import { ProcessosCompraModule } from "../../modules/processos-compra/processos-compra.module";
import { ResponsaveisModule } from "../../modules/responsaveis/responsaveis.module";
import { SetoresModule } from "../../modules/setores/setores.module";
import { UsuariosModule } from "../../modules/usuarios/usuarios.module";
import { SeedGeralService } from "./seed-geral.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    ArmazenamentoDocumentosModule,
    AuthModule,
    ComissoesModule,
    EspeciesModule,
    FornecedoresModule,
    InventariosModule,
    ManutencoesModule,
    NaturezasModule,
    PatrimoniosModule,
    ProcessosCompraModule,
    ResponsaveisModule,
    SetoresModule,
    UsuariosModule,
  ],
  providers: [SeedGeralService],
})
export class SeedGeralModule {}
