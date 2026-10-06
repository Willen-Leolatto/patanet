# Prompt Schema (Structured Format)

Prompts estruturados usam blocos XML para organizar o contexto. Cada bloco tem um propósito específico. Técnicas de prompt engineering aplicadas: contextual priming, delimitadores, XML tags, output format control.

## Blocos Obrigatórios

| Bloco | Propósito | Exemplo |
|-------|-----------|---------|
| `<task>` | Descrição concisa da tarefa em uma linha | `<task>Implementação do Painel de Clima</task>` |
| `<role>` | Papel do agente e contexto da tarefa | `<role>Você é um desenvolvedor full stack senior...</role>` |
| `<requirements>` | Requisitos organizados por categoria | Business, Technical, UI/UX |
| `<critical>` | Restrições e skills obrigatórias | Skills, fora do escopo |

## Blocos Opcionais (incluir quando aplicável)

| Bloco | Propósito | Quando usar |
|-------|-----------|-------------|
| `<goals>` | Objetivo em uma frase (foco) | Sempre que ajudar a direcionar a atenção do modelo |
| `<workflow>` | Passos de raciocínio (Chain-of-Thought) | Tarefas complexas com múltiplas etapas |
| `<output>` | Formato esperado da saída | JSON, tabela, markdown, estrutura de arquivos |
| `<profile>` | Autor, versão, idioma | Prompts reutilizáveis ou versionados |
| `<endpoints>` | APIs, rotas, payloads | Quando há integração com APIs ou backend |
| `<tests>` | Validações e testes | Quando há endpoints ou fluxos a validar |

## Delimitadores

Entre blocos longos (mais de 5 linhas), use `---` como separador visual. Delimitadores explícitos melhoram precisão e estabilidade do modelo.

## Estrutura de `<requirements>`

```
### Business
- Requisitos de negócio (o que o usuário precisa)

### Technical
- Requisitos técnicos (stack, arquitetura, fluxo de dados)

### UI/UX
- Requisitos de interface e experiência
```

## Estrutura de `<critical>`

```
### Skills obrigatórias
- Lista de skills do projeto que devem ser ativadas

### Fora do Escopo
- O que NÃO deve ser implementado (explícito)
```

## Estrutura de `<goals>`

Uma frase que resume o objetivo principal. Exemplo: "Implementar painel de clima consumindo Open-Meteo via backend, com UI responsiva e feedback visual."

## Estrutura de `<workflow>`

Passos numerados para tarefas complexas (Chain-of-Thought). Exemplo:

```
1. [Primeiro passo lógico]
2. [Segundo passo]
3. [Terceiro passo]
```

## Estrutura de `<output>`

Especificar formato: "Código React + endpoint Express", "JSON com campos X, Y, Z", "Tabela markdown", etc.

## Estrutura de `<profile>`

```
- author: [nome]
- version: [semver]
- language: [pt-BR, en, etc.]
```
