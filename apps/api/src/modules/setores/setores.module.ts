import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ResponsaveisModule } from "../responsaveis/responsaveis.module";
import { SetoresController } from "./setores.controller";
import { SetoresRepository } from "./setores.repository";
import { SetoresService } from "./setores.service";

@Module({
  imports: [DatabaseModule, ResponsaveisModule],
  controllers: [SetoresController],
  providers: [SetoresRepository, SetoresService],
  exports: [SetoresService],
})
export class SetoresModule {}
