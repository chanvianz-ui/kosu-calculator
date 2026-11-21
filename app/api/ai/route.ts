import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "AI Gateway belum dikonfigurasi. Tambahkan AI_GATEWAY_API_KEY di environment Vercel." },
      { status: 503 },
    );
  }

  let body: { prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  if (typeof body.prompt !== "string" || !body.prompt.trim()) {
    return Response.json({ error: "Prompt wajib diisi." }, { status: 400 });
  }

  if (body.prompt.length > 12000) {
    return Response.json({ error: "Prompt terlalu panjang. Maksimal 12.000 karakter." }, { status: 413 });
  }

  try {
    const result = streamText({
      model: "openai/gpt-6.2-astra",
      prompt: body.prompt.trim(),
      maxOutputTokens: 1200,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Gateway request failed:", error);
    return Response.json({ error: "Gagal memulai permintaan AI." }, { status: 500 });
  }
}
