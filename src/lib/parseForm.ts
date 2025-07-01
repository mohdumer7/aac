import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

export function streamFromRequest(req: Request): Readable {
  const reader = req.body?.getReader();
  return new Readable({
    async read() {
      if (!reader) return this.push(null);
      const { done, value } = await reader.read();
      if (done) return this.push(null);
      this.push(value);
    }
  });
}

export async function parseForm(req: Request): Promise<{ fields: any; files: any }> {
  const form = new IncomingForm({ multiples: true, keepExtensions: true });
  const stream = streamFromRequest(req);

  return new Promise((resolve, reject) => {
    form.parse(stream as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}
