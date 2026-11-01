import { ServiceUnavailableException } from "@nestjs/common";
// Opt-in: preserva a normalização histórica das demais exceções 5xx.
export class DependenciaConsultaIndisponivelException extends ServiceUnavailableException {}
