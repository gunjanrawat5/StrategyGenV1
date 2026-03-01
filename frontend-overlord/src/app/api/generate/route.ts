import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const response = await fetch(`${BACKEND_BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const bodyText = await response.text();
    return new NextResponse(bodyText, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create generation job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
