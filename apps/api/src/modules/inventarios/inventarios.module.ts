import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { InventariosController } from "./inventarios.controller";
import { InventariosRepository } from "./inventarios.repository";
import { InventariosService } from "./inventarios.service";

@Module({
  imports: [DatabaseModule, ComissoesModule],
  controllers: [InventariosController],
  providers: [InventariosRepository, InventariosService],
})
export class InventariosModule {}
