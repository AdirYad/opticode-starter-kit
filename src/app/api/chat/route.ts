import { generateText } from "ai";
import { env } from "@/lib/env";

// Allow responses up to 30s on serverless.
export const maxDuration = 30;

/**
 * Minimal AI endpoint, routed through the Vercel AI Gateway.
 *
 * The model is a plain "<provider>/<model>" string (e.g. "openai/gpt-4o-mini",
 * "anthropic/claude-sonnet-4.5"). With AI_GATEWAY_API_KEY set, the AI SDK
 * sends the request through the gateway automatically, with no per-provider keys.
 *
 * POST body: { "prompt": "..." }  ->  { "text": "..." }
 *
 * To stream tokens instead, switch to `streamText` + `toUIMessageStreamResponse()`.
 */
export async function POST(req: Request) {
  let prompt: string | undefined;
  try {
    ({ prompt } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string") {
    return Response.json(
      { error: "Body must include a non-empty 'prompt' string." },
      { status: 400 },
    );
  }

  const { text } = await generateText({
    model: env.AI_DEFAULT_MODEL,
    system: "You are a helpful assistant for the Opticode Starter app.",
    prompt,
  });

  return Response.json({ text });
}
