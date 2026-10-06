import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { EnvService } from 'src/env/env.service'
import { Report } from '../../domain/entities/report'
import {
  ReportDispatchPort,
  ReportDispatchResult,
} from '../../application/ports/report-dispatch.port'

/**
 * Implementacao atual da camada de despacho: nao ha credenciais de SMTP
 * configuradas no projeto, entao a "triagem por e-mail" fica registrada em
 * log estruturado (com o destinatario configurado em
 * REPORT_FORWARDING_EMAIL) em vez de enviar de fato. Se
 * PUBLIC_AUTHORITY_REPORT_WEBHOOK estiver configurado, tambem faz o POST
 * pro webhook do orgao publico. Pronta pra virar um adapter de e-mail real
 * assim que houver credenciais -- so trocar o binding em ReportsModule.
 */
@Injectable()
export class LoggingReportDispatchAdapter extends ReportDispatchPort {
  private readonly logger = new Logger(LoggingReportDispatchAdapter.name)

  constructor(private readonly envService: EnvService) {
    super()
  }

  async dispatch(report: Report): Promise<ReportDispatchResult> {
    const forwardingEmail = this.envService.get('REPORT_FORWARDING_EMAIL')
    const webhookUrl = this.envService.get('PUBLIC_AUTHORITY_REPORT_WEBHOOK')
    const reference = randomUUID()

    this.logger.warn(
      `[report-dispatch] reportId=${report.id.toValue()} category=${report.category} ` +
        `forwardTo=${forwardingEmail} reference=${reference}`,
    )

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: report.id.toValue(),
            type: report.type,
            category: report.category,
            targetId: report.targetId,
            message: report.message,
            reference,
          }),
        })
        return { channel: 'webhook+log', reference }
      } catch (err) {
        this.logger.error(
          `[report-dispatch] webhook falhou pra reportId=${report.id.toValue()}: ${err}`,
        )
      }
    }

    return { channel: 'log', reference }
  }
}
