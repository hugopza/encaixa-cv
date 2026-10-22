import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { AnalysisEvidenceError } from './domain';

export function strictTool<T>(schema: z.ZodType<T>): Anthropic.Tool {
  return {
    name: 'submit_result',
    description: 'Retorna el resultat amb els tipus exactes de l’esquema. Els camps array són llistes JSON, mai cadenes de text.',
    strict: true,
    input_schema: zodOutputFormat(schema).schema as Anthropic.Tool.InputSchema,
  };
}

export function validationFeedback(error: unknown) {
  if (error instanceof AnalysisEvidenceError) return `${error.message} Corregeix el camp indicat copiant un fragment continu de resume exactament. No concatenis frases separades, no tradueixis ni afegeixis punts suspensius. Conserva la resta dels camps vàlids i tots els IDs demanats.`;
  if (error instanceof z.ZodError) {
    return `Format incorrecte: ${error.issues.slice(0, 8).map(issue => `${issue.path.join('.')}: ${issue.code}`).join('; ')}. Respecta els tipus de l’esquema: els arrays han de ser llistes JSON, no text.`;
  }
  return 'Comprova que els IDs coincideixin exactament amb els demanats i que totes les cites siguin fragments literals de la font corresponent, sense traduir-les ni reformular-les.';
}
