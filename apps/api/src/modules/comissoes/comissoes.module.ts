import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ComissoesController } from "./comissoes.controller";
import { ComissoesRepository } from "./comissoes.repository";
import { ComissoesService } from "./comissoes.service";

@Module({
  imports: [DatabaseModule],
  controllers: [ComissoesController],
  providers: [ComissoesRepository, ComissoesService],
  exports: [ComissoesService],
})
export class ComissoesModule {}
