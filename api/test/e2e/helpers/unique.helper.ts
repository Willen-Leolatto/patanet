/**
 * Timestamp + sufixo aleatorio: Date.now() sozinho pode colidir entre
 * arquivos de spec diferentes que criam fixtures no mesmo milissegundo
 * (ex.: em runInBand rapido ou execucao paralela), causando 409 de
 * username/email duplicado.
 */
export function uniqueSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
