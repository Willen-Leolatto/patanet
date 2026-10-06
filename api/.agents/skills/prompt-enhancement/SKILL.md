---
name: prompt-enhancement
description: Transforms vague or poorly structured prompts into structured prompts using XML and Markdown. Applies techniques: goals, workflow (Chain-of-Thought), output format, few-shot patterns, delimiters. Produces prompts with task, goals, role, requirements (business, technical, UI/UX), workflow, output, endpoints, tests, and critical constraints. Do not use for prompts that are already well-structured or for general documentation.
---

# Prompt Enhancement

Transforma prompts vagos ou mal estruturados em prompts estruturados com XML e Markdown, seguindo boas práticas e trazendo mais contexto para o agente executor.

## Procedimento

**Step 1: Analisar o prompt de entrada**

1. Leia o prompt fornecido pelo usuário na íntegra.
2. Identifique a tarefa principal, requisitos implícitos e explícitos, APIs mencionadas e restrições.
3. Leia `references/prompt-schema.md` para entender a estrutura de saída.
4. Leia `references/before-after-example.md` para ver o padrão de transformação.
5. Se a tarefa for complexa ou ambígua, leia `references/few-shot-examples.md` para exemplos por tipo.

**Step 2: Extrair e categorizar**

1. Extraia a tarefa em uma linha concisa para `<task>`.
2. Defina `<goals>`: uma frase que resume o objetivo principal (foco do modelo).
3. Defina o `<role>` com base no contexto (stack, domínio, tipo de tarefa). Inclua a referência à tarefa.
4. Separe requisitos em:
   - **Business:** o que o usuário precisa em termos de valor/funcionalidade.
   - **Technical:** stack, arquitetura, fluxo de dados (frontend ↔ backend ↔ API externa).
   - **UI/UX:** responsividade, loading, erros, feedback visual, acessibilidade.
5. Se a tarefa tiver múltiplas etapas, extraia `<workflow>` com passos numerados (Chain-of-Thought).
6. Se o formato de saída for relevante, defina `<output>` (código, JSON, tabela, estrutura).
7. Se houver APIs ou endpoints, documente em `<endpoints>` com URL, método, status codes e payload.
8. Se houver endpoints, adicione `<tests>` com validações (ex.: curl para testar).
9. Em `<critical>`, liste:
   - **Skills obrigatórias:** skills do projeto relevantes (frontend-design, shadcn, ui-ux-pro-max, etc.).
   - **Fora do Escopo:** o que *NÃO* deve ser implementado, usando *NÃO* ou *NUNCA* para ênfase.

**Step 3: Montar o prompt estruturado**

1. Leia `assets/structured-prompt-template.md` para o esqueleto.
2. Preencha cada bloco com o conteúdo extraído e categorizado.
3. Remova blocos vazios ou não aplicáveis (ex.: `<endpoints>` se não houver APIs; `<workflow>` se tarefa simples).
4. Entre blocos longos (mais de 5 linhas), insira `---` como delimitador visual.
5. Garanta que requisitos vagos sejam tornados explícitos (ex.: "exiba os dados" → "cards com ícones, gráfico interativo, skeleton loading").

**Step 4: Validar**

1. Leia `references/checklist.md` e verifique cada item.
2. Execute `python3 scripts/validate-structure.py` passando o prompt gerado via stdin para confirmar blocos obrigatórios.
3. Confirme que não há lacunas de interpretação (o agente executor não deve precisar adivinhar).

## Error Handling

- **Prompt já estruturado:** Se o prompt de entrada já contiver blocos XML (`<task>`, `<role>`, etc.), informe o usuário e ofereça refinamento em vez de reestruturação completa.
- **Contexto insuficiente:** Se o prompt for muito vago (ex.: "faça um app"), solicite ao usuário mais detalhes (stack, funcionalidades, APIs) antes de gerar o prompt estruturado.
- **Skills desconhecidas:** Se o projeto não tiver skills explícitas, use skills genéricas do domínio (frontend-design, shadcn, ui-ux-pro-max para UI; vercel-react-best-practices para React).
- **Validação falhou:** Se `scripts/validate-structure.py` retornar erro, adicione os blocos faltantes ao prompt gerado.
