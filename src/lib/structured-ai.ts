import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { HttpError } from './http';
import { strictTool, validationFeedback } from './ai-contract';
import { AnalysisEvidenceError } from './domain';

export async function structuredAi<T>({ system, data, schema, validate }: { system: string; data: unknown; schema: z.ZodType<T>; validate?: (value: T) => T }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, 'Falta configurar la clau d’Anthropic.');
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 35_000 });
  // The SDK transforms unsupported JSON Schema constraints; local Zod still enforces them.
  const tool = strictTool(schema);
  let correction = '';
  let previousResult: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({ model, max_tokens: 4000, temperature: 0, system,
        messages: [{ role: 'user', content: JSON.stringify({ data, correction, previousResult }) }],
        tools: [tool], tool_choice: { type: 'tool', name: 'submit_result' },
      });
      if (response.stop_reason === 'max_tokens') throw new HttpError(502, 'Anthropic ha truncat la resposta pel límit de tokens. Redueix el nombre de criteris o la longitud del text.');
      if (response.stop_reason === 'refusal') throw new HttpError(422, 'El model no ha acceptat aquesta petició. Revisa el contingut enviat.');
      const block = response.content.find(b => b.type === 'tool_use');
      if (!block || block.type !== 'tool_use') throw new Error('Falta la resposta estructurada.');
      previousResult = block.input;
      const value = schema.parse(block.input);
      return { value: validate ? validate(value) : value, model };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error instanceof Anthropic.APIConnectionTimeoutError) throw new HttpError(504, 'Anthropic ha superat el temps d’espera. Reintenta-ho.');
      if (error instanceof Anthropic.APIConnectionError) throw new HttpError(502, 'No hi ha connexió amb Anthropic. Reintenta-ho.');
      if (error instanceof Anthropic.APIError) {
        if (error.status === 401 || error.status === 403) throw new HttpError(503, 'Anthropic rebutja la clau. Revisa ANTHROPIC_API_KEY.');
        if (error.status === 429) throw new HttpError(429, 'Anthropic ha limitat les peticions. Reintenta més tard.');
        if (error.status === 404) throw new HttpError(503, 'El model configurat no està disponible.');
        if (/credit|balance|billing/i.test(error.message)) throw new HttpError(503, 'Cal revisar el saldo o la facturació d’Anthropic.');
        throw new HttpError(502, 'Anthropic no ha pogut completar la petició. Reintenta-la.');
      }
      correction = validationFeedback(error);
      if (attempt === 1 && error instanceof AnalysisEvidenceError) throw new HttpError(502, `No s’ha pogut validar l’anàlisi: ${error.message} No s’ha desat cap valoració. Torna-ho a provar.`);
      if (attempt === 1) throw new HttpError(502, error instanceof z.ZodError ? 'Anthropic ha retornat un format incompatible amb l’esquema. No s’ha desat cap resultat.' : 'La resposta d’IA no ha superat la comprovació d’IDs o evidències. No s’ha desat cap valoració inventada.');
    }
  }
  throw new HttpError(502, 'No s’ha pogut completar la generació.');
}
