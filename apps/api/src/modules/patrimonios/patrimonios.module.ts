import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { PatrimoniosController } from "./patrimonios.controller";
import { PatrimoniosRepository } from "./patrimonios.repository";
import { PatrimoniosService } from "./patrimonios.service";

@Module({
  imports: [DatabaseModule],
  controllers: [PatrimoniosController],
  providers: [PatrimoniosRepository, PatrimoniosService],
  exports: [PatrimoniosService],
})
export class PatrimoniosModule {}
