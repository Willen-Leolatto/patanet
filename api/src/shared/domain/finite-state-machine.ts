/**
 * Máquina de estados finita genérica e agnóstica de framework, usada para
 * validar transições de status em entidades de domínio (ex.: Report,
 * SupportTicket). Cada entidade define seu próprio grafo de transições
 * válidas; esta classe só sabe consultar esse grafo — mantém a lógica de
 * validação de transição unificada num único lugar, em vez de cada
 * entidade reimplementar sua própria checagem ad-hoc.
 */
export class FiniteStateMachine<TStatus extends string> {
  constructor(private readonly transitions: Record<TStatus, TStatus[]>) {}

  /**
   * Uma transição para o mesmo status é sempre permitida (idempotência) —
   * evita que o chamador precise tratar "sem mudança" como um caso especial.
   */
  canTransition(from: TStatus, to: TStatus): boolean {
    if (from === to) return true
    const allowed = this.transitions[from] ?? []
    return allowed.includes(to)
  }
}
