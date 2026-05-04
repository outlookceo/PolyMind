import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { ProviderAdapterError } from "@/server/ai/providers/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "请求体必须是合法 JSON。");
  }

  return schema.parse(body);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "请求参数不合法。"
        }
      },
      { status: 400 }
    );
  }

  if (error instanceof ProviderAdapterError) {
    return NextResponse.json(
      {
        error: {
          code: error.providerError.code ?? "PROVIDER_ERROR",
          message: error.providerError.message
        }
      },
      { status: error.providerError.status ?? 502 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_ERROR",
          message: "数据库操作失败，请检查数据是否重复或仍被引用。"
        }
      },
      { status: 400 }
    );
  }

  const message =
    error instanceof Error && error.message.includes("ENCRYPTION_KEY")
      ? error.message
      : "服务器处理请求时出现错误。";

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}
