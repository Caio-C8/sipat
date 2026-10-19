import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { NaturezasController } from "./naturezas.controller";
import { NaturezasRepository } from "./naturezas.repository";
import { NaturezasService } from "./naturezas.service";

@Module({
  imports: [DatabaseModule],
  controllers: [NaturezasController],
  providers: [NaturezasRepository, NaturezasService],
  exports: [NaturezasService],
})
export class NaturezasModule {}
