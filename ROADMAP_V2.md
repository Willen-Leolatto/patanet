# Roadmap V2 — Vet + Petshop (PataNet)

> Documento de referência (não implementa funcionalidades).  
> Objetivo: registrar o escopo validado para a V2 após estabilização do app.

## 1) Novas roles
- **PETSHOP**: perfil corporativo (banho/tosa) com agenda e avisos.
- Vet/Staff/Admin continuam como hoje.

## 2) Agenda de banho e tosa (avisos) — PETSHOP
- Agendamento com horários e confirmação.
- Avisos (push/in-app) para:
  - confirmação do agendamento
  - lembrete (ex.: 24h / 1h)
  - alteração/cancelamento

## 3) Agenda de consultas (avisos) — VET + PETSHOP
- Petshop pode ter **vários tutores e vários vets vinculados**.
- Avisos (push/in-app) para:
  - consulta marcada
  - lembrete
  - alteração/cancelamento

## 4) Avisos de animais perdidos
- Tutor define status do pet como **Desaparecido**.
- Sempre que o pet for:
  - marcado em post, ou
  - visitado no perfil
  …mostrar destaque/aviso “Desaparecido” (com CTA para contato/aviso).

## 5) Receituário integrado no perfil
- Já planejado.

## 6) Histórico de doenças integrado no perfil
- Já planejado, atrelado ao módulo Vet.

## 7) Árvore genealógica (cruzas)
- **Fora do escopo por enquanto**, mas previsto após Vet + Petshop estabilizarem.

## Ordem sugerida (após correções atuais)
1. Finalizar correções/UX e estabilidade (auth/401, cadastro, layout)
2. Consolidar módulo Vet
3. Introduzir role PETSHOP + agenda banho/tosa
4. Evoluir agenda de consultas multi-vet/multi-tutor
5. Sistema de “pet desaparecido”
