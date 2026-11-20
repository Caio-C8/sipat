import { Injectable } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { diaSaoPaulo } from "../../common/utils/datas-institucionais";
import { DashboardRepository } from "./dashboard.repository";

export function subtrairDiasCivis(dataCivil: string, quantidade: number) {
  const data = new Date(`${dataCivil}T12:00:00.000Z`);
  data.setUTCDate(data.getUTCDate() - quantidade);
  return data.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(private readonly dashboard: DashboardRepository) {}

  consultar(identidade: IdentidadeAutenticada, agora = new Date()) {
    const hoje = diaSaoPaulo(agora);
    return this.dashboard.consultar(identidade.id, subtrairDiasCivis(hoje, 14));
  }
}
