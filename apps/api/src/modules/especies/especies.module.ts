import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { NaturezasModule } from "../naturezas/naturezas.module";
import { EspeciesController } from "./especies.controller";
import { EspeciesRepository } from "./especies.repository";
import { EspeciesService } from "./especies.service";

@Module({
  imports: [DatabaseModule, NaturezasModule],
  controllers: [EspeciesController],
  providers: [EspeciesRepository, EspeciesService],
  exports: [EspeciesService],
})
export class EspeciesModule {}
