import { SetMetadata } from "@nestjs/common";
import { CHAVE_ROTA_PUBLICA } from "../auth.constants";

export const Publica = () => SetMetadata(CHAVE_ROTA_PUBLICA, true);
