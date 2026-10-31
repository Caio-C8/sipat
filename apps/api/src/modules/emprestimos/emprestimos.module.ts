import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { PatrimoniosModule } from "../patrimonios/patrimonios.module";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { InventariosModule } from "../inventarios/inventarios.module";
import { EmprestimosController } from "./emprestimos.controller";
import { EmprestimosRepository } from "./emprestimos.repository";
import { EmprestimosService } from "./emprestimos.service";

@Module({
  imports: [
    DatabaseModule,
    PatrimoniosModule,
    ComissoesModule,
    InventariosModule,
  ],
  controllers: [EmprestimosController],
  providers: [EmprestimosRepository, EmprestimosService],
  exports: [EmprestimosService],
})
export class EmprestimosModule {}
