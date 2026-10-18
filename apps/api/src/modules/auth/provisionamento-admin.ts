import type { CriarUsuarioData } from "@repo/contracts";
import { type DatabaseClient, Prisma } from "@repo/database";
import type { SenhaHasher } from "../../common/security/senha-hasher";

const MAXIMO_TENTATIVAS_TRANSACAO = 3;
const CHAVE_BLOQUEIO_PROVISIONAMENTO = 1_932_740_001;

export class ProvisionamentoAdministradorRecusadoError extends Error {
  constructor() {
    super(
      "O provisionamento foi recusado porque o banco já possui um usuário.",
    );
    this.name = "ProvisionamentoAdministradorRecusadoError";
  }
}

export async function provisionarPrimeiroAdministrador(
  database: DatabaseClient,
  senhaHasher: SenhaHasher,
  dados: Omit<CriarUsuarioData, "perfil">,
): Promise<void> {
  const senhaHash = await senhaHasher.criarHash(dados.senha);

  for (
    let tentativa = 1;
    tentativa <= MAXIMO_TENTATIVAS_TRANSACAO;
    tentativa += 1
  ) {
    try {
      await database.$transaction(
        async (transaction) => {
          await transaction.$executeRaw`
            SELECT pg_advisory_xact_lock(${CHAVE_BLOQUEIO_PROVISIONAMENTO})
          `;

          if ((await transaction.usuario.count()) !== 0) {
            throw new ProvisionamentoAdministradorRecusadoError();
          }

          await transaction.usuario.create({
            data: {
              nome: dados.nome,
              email: dados.email,
              senha: senhaHash,
              perfil: "ADMINISTRADOR",
              ativo: true,
              createdById: null,
            },
          });
        },
        { isolationLevel: "Serializable" },
      );

      return;
    } catch (erro: unknown) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2034" &&
        tentativa < MAXIMO_TENTATIVAS_TRANSACAO
      ) {
        continue;
      }

      throw erro;
    }
  }
}
