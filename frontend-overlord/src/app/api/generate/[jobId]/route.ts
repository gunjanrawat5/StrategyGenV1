import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const params = await context.params;
    const response = await fetch(`${BACKEND_BASE_URL}/jobs/${params.jobId}`, {
      method: "GET",
      cache: "no-store",
    });

    const bodyText = await response.text();
    return new NextResponse(bodyText, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch generation job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
