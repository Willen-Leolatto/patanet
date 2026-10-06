# Few-Shot Examples por Tipo de Tarefa

Exemplos de transformação para guiar o agente. Use como referência quando a tarefa se encaixar no padrão.

---

## Tipo: Feature Full-Stack (API + UI)

**Entrada típica:** "Implemente X que usa a API Y. O frontend deve..."

**Padrão de saída:**
- `<goals>`: Integrar API Y via backend, expor endpoint, exibir dados em UI responsiva
- `<workflow>`: 1) Criar endpoint backend → 2) Integrar API externa → 3) Consumir no frontend → 4) Tratar loading/erros
- `<output>`: Código React + endpoint Express + tipos TypeScript
- `<endpoints>`: API externa + rota do backend
- `<tests>`: curl para validar endpoints

---

## Tipo: Refatoração / Melhoria

**Entrada típica:** "Melhore o componente X", "Refatore para usar Y"

**Padrão de saída:**
- `<goals>`: Refatorar mantendo comportamento, melhorar [performance/legibilidade/UX]
- `<workflow>`: 1) Analisar código atual → 2) Identificar pontos de melhoria → 3) Aplicar mudanças → 4) Validar
- `<output>`: Código refatorado com comentários de mudança (se aplicável)
- `<critical>`: Fora do escopo — não alterar [X, Y, Z]

---

## Tipo: UI/Componente Isolado

**Entrada típica:** "Crie um botão que faz X", "Faça um card de produto"

**Padrão de saída:**
- `<goals>`: Componente reutilizável com [props/variantes] especificadas
- `<requirements>`: UI/UX detalhado (estados, acessibilidade, responsividade)
- `<output>`: Componente React + tipos + exemplo de uso
- Skills: frontend-design, shadcn, ui-ux-pro-max

---

## Tipo: Integração de Dados (CRUD, Formulário)

**Entrada típica:** "Formulário de cadastro que salva em X"

**Padrão de saída:**
- `<workflow>`: 1) Definir schema/validação → 2) Criar endpoint → 3) Formulário com validação → 4) Feedback de sucesso/erro
- `<output>`: Schema Zod + endpoint + componente de formulário
- `<tests>`: Validação de payload, tratamento de erros
