# Checklist de Validação do Prompt Estruturado

Use este checklist para validar o prompt gerado antes de entregar ao usuário.

## Blocos

- [ ] `<task>` presente e conciso (uma linha)
- [ ] `<goals>` presente (uma frase de foco)
- [ ] `<role>` define o agente e o contexto
- [ ] `<requirements>` separados em Business, Technical, UI/UX
- [ ] `<critical>` inclui skills obrigatórias e fora do escopo
- [ ] `<workflow>` incluído quando tarefa complexa (múltiplas etapas)
- [ ] `<output>` incluído quando formato de saída for relevante
- [ ] `<endpoints>` incluído quando há APIs ou backend
- [ ] `<tests>` incluído quando há endpoints ou fluxos a validar

## Qualidade

- [ ] Requisitos explícitos (nada implícito ou vago)
- [ ] Fora do escopo usa *NÃO* ou *NUNCA* para ênfase
- [ ] Endpoints com método, rota e status codes
- [ ] UI/UX inclui loading, erros e feedback visual quando aplicável
- [ ] Delimitador `---` entre blocos longos (5+ linhas)
