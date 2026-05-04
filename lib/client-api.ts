type ApiSuccess<T> = {
  data: T;
};

type ApiFailure = {
  error: {
    code: string;
    message: string;
  };
};

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error.message : "请求失败。");
  }

  return payload.data;
}

export function formatDateTime(value: string | null) {
  if (!value) return "尚未使用";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
