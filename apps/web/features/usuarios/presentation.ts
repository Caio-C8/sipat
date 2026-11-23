const PERFIL_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  DIRETOR_PATRIMONIO: "Diretor de patrimônio",
};

export function perfilLabel(perfil: string) {
  return PERFIL_LABELS[perfil] ?? perfil;
}
