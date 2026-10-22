import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';
import { z } from 'zod';
import { authenticated, failure, HttpError } from '@/lib/http';

export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const { sb, user } = await authenticated(request);
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 3_000_000) throw new HttpError(413, 'El fitxer supera el límit de 2 MB.');
    const form = await request.formData();
    const jobId = z.uuid().parse(form.get('jobId'));
    const name = z.string().trim().min(2).max(120).parse(form.get('name'));
    const email = z.union([z.email(), z.literal('')]).parse(String(form.get('email') || '').trim());
    const { data: job } = await sb.from('jobs').select('id').eq('id', jobId).eq('user_id', user.id).maybeSingle();
    if (!job) throw new HttpError(404, 'No s’ha trobat la vacant.');
    let text = String(form.get('text') || '').trim();
    let filename: string | null = null;
    const file = form.get('file');
    if (file instanceof File && file.size > 0) {
      if (file.size > 2_000_000) throw new HttpError(413, 'El fitxer supera el límit de 2 MB.');
      filename = file.name.slice(0, 160);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (/\.pdf$/i.test(file.name)) {
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new HttpError(400, 'El fitxer no és un PDF vàlid.');
        try {
          const pdf = await getDocumentProxy(bytes);
          try {
            if (pdf.numPages > 15) throw new HttpError(400, 'El CV pot tenir com a màxim 15 pàgines.');
            const result = await extractText(pdf, { mergePages: true });
            text = result.text;
          } finally { await pdf.destroy(); }
        } catch (e) {
          if (e instanceof HttpError) throw e;
          throw new HttpError(400, 'No es pot llegir aquest PDF. Enganxa el text del CV.');
        }
      } else if (/\.txt$/i.test(file.name)) text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      else throw new HttpError(400, 'Formats admesos: PDF amb text i TXT.');
    }
    text = text.replace(/\u0000/g, '').trim();
    if (text.length < 100) throw new HttpError(400, 'No hi ha prou text. Si el PDF és escanejat, enganxa el contingut del CV.');
    if (text.length > 45000) throw new HttpError(400, 'El CV supera els 45.000 caràcters. Redueix-ne el contingut.');
    const hash = createHash('sha256').update(text.normalize('NFKC').replace(/\s+/g, ' ')).digest('hex');
    const { data, error } = await sb.from('candidates').insert({ user_id: user.id, job_id: jobId, name, email: email || null, resume_text: text, filename, content_hash: hash }).select().single();
    if (error?.code === '23505') throw new HttpError(409, 'Aquest CV ja existeix en aquesta vacant.');
    if (error) throw new HttpError(500, 'No s’ha pogut desar el candidat.');
    return NextResponse.json(data, { status: 201 });
  } catch (e) { return failure(e); }
}
