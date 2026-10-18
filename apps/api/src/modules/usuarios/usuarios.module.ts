import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { SenhaHasher } from "../../common/security/senha-hasher";
import { UsuariosController } from "./usuarios.controller";
import { UsuariosRepository } from "./usuarios.repository";
import { UsuariosService } from "./usuarios.service";

@Module({
  imports: [DatabaseModule],
  controllers: [UsuariosController],
  providers: [UsuariosRepository, UsuariosService, SenhaHasher],
  exports: [UsuariosService],
})
export class UsuariosModule {}
