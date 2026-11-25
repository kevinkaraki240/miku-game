import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const ok = (data, status = 200) => NextResponse.json(data, { status });

export function handle(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Dữ liệu không hợp lệ',
            details: e.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
          },
          { status: 400 }
        );
      }
      console.error(e);
      return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
    }
  };
}

export async function body(request, schema) {
  let json;
  try {
    json = await request.json();
  } catch {
    throw new HttpError(400, 'JSON không hợp lệ');
  }
  return schema.parse(json);
}