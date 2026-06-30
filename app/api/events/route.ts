// Server-Sent Events endpoint for live updates
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      // Send a ping every 2 seconds so clients know to re-fetch
      intervalId = setInterval(() => {
        controller.enqueue(encoder.encode(`data: ping\n\n`));
      }, 2000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
