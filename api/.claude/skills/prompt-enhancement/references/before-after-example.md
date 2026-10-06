# Exemplo: Prompt Base vs Prompt Estruturado

## Prompt Base (entrada típica)

```
Implemente um painel de clima no frontend e backend existente.

O usuário deve poder digitar uma cidade e ver o clima atual.

Para obter os dados, utilize a API Open-Meteo (gratuita, sem necessidade de API key):

• Geocoding API: https://geocoding-api.open-meteo.com/v1/search (converter cidade em coordenadas)
• Weather API: https://api.open-meteo.com/v1/forecast (obter dados do clima)

O frontend deve buscar os dados somente do backend. Opcionalmente, o frontend pode tentar obter a localização do usuário pelo navegador (geolocation) e sugerir a cidade automaticamente.

Crie um endpoint no backend para o frontend consumir e exiba os dados no painel.
```

## Problemas do prompt base

- Não define papel do agente
- Requisitos misturados (business, técnico, UI)
- Falta especificação de endpoint (método, status codes)
- Não menciona skills do projeto
- Não define fora do escopo
- Falta detalhes de UI/UX (loading, erros, responsividade)

## Prompt Estruturado (saída esperada)

Ver `assets/structured-prompt-template.md` para o template completo. O resultado deve:

1. Extrair a tarefa em `<task>`
2. Definir `<goals>` (uma frase de foco)
3. Definir `<role>` com contexto e stack
4. Separar `<requirements>` em Business, Technical, UI/UX
5. Incluir `<workflow>` para tarefas com múltiplas etapas
6. Definir `<output>` quando o formato de saída for relevante
7. Documentar `<endpoints>` com URLs, métodos, status codes
8. Incluir `<tests>` quando houver endpoints
9. Listar `<critical>`: skills obrigatórias e fora do escopo
10. Usar `---` como delimitador entre blocos longos
