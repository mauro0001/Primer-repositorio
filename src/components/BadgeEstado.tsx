import { COLORES_ESTADO, ETIQUETAS_ESTADO, type EstadoSemaforo } from "@/lib/calendario";

export function BadgeEstado({ estado }: { estado: EstadoSemaforo }) {
  return <span className={`badge ${COLORES_ESTADO[estado]}`}>{ETIQUETAS_ESTADO[estado]}</span>;
}
