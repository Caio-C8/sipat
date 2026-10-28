import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { PatrimoniosModule } from "../patrimonios/patrimonios.module";
import { SetoresModule } from "../setores/setores.module";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { InventariosModule } from "../inventarios/inventarios.module";
import { MovimentacoesController } from "./movimentacoes.controller";
import { MovimentacoesService } from "./movimentacoes.service";
import { MovimentacoesRepository } from "./movimentacoes.repository";
@Module({
  imports: [
    DatabaseModule,
    PatrimoniosModule,
    SetoresModule,
    ComissoesModule,
    InventariosModule,
  ],
  controllers: [MovimentacoesController],
  providers: [MovimentacoesService, MovimentacoesRepository],
  exports: [MovimentacoesService],
})
export class MovimentacoesModule {}
