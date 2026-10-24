const MODEL_ID = "@cf/google/gemma-4-26b-a4b-it";

function statusResponse(status: "success" | "failure", httpStatus: number) {
  return Response.json(
    { status, model: MODEL_ID },
    { status: httpStatus, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

  if (
    process.env.NODE_ENV !== "development" ||
    !localHosts.has(requestUrl.hostname.toLowerCase())
  ) {
    return statusResponse("failure", 404);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== requestUrl.origin) {
        return statusResponse("failure", 403);
      }
    } catch {
      return statusResponse("failure", 403);
    }
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    return statusResponse("failure", 503);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let upstream: Response;

    try {
      upstream = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: "Reply with exactly OK." },
            ],
            max_tokens: 4,
          }),
          cache: "no-store",
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!upstream.ok) {
      await upstream.body?.cancel();
      return statusResponse("failure", 502);
    }

    const payload = (await upstream.json()) as { success?: boolean };
    if (payload.success !== true) {
      return statusResponse("failure", 502);
    }

    return statusResponse("success", 200);
  } catch {
    return statusResponse("failure", 502);
  }
}
