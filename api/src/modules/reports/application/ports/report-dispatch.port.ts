import { Report } from '../../domain/entities/report'

export interface ReportDispatchResult {
  channel: string
  reference: string | null
}

/**
 * Camada de despacho do canal de denuncias: triagem inicial e envio a
 * orgaos publicos competentes (Delegacias de Protecao Animal, Ministerio
 * Publico, Centros de Controle de Zoonoses, Disque-Denuncia). Ver
 * LoggingReportDispatchAdapter para a implementacao atual.
 */
export abstract class ReportDispatchPort {
  abstract dispatch(report: Report): Promise<ReportDispatchResult>
}
