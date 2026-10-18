import { Injectable } from "@nestjs/common";
import { argon2id, hash, verify } from "argon2";

const ARGON2_MEMORY_COST_KIB = 19_456;
const ARGON2_TIME_COST = 2;
const ARGON2_PARALLELISM = 1;

@Injectable()
export class SenhaHasher {
  criarHash(senha: string): Promise<string> {
    return hash(senha, {
      type: argon2id,
      memoryCost: ARGON2_MEMORY_COST_KIB,
      timeCost: ARGON2_TIME_COST,
      parallelism: ARGON2_PARALLELISM,
    });
  }

  verificarHash(hashArmazenado: string, senha: string): Promise<boolean> {
    return verify(hashArmazenado, senha);
  }
}
