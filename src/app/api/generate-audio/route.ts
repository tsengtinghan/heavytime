import { fal } from "@fal-ai/client";
import { NextRequest } from "next/server";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, storyId } = await request.json();

    if (!text || !storyId) {
      return Response.json(
        { error: "Missing text or storyId" },
        { status: 400 }
      );
    }

    // Call fal.ai Minimax TTS API
    const result = await fal.subscribe("fal-ai/minimax/preview/speech-2.5-hd", {
      input: {
        text: text,
        voice_setting: {
          voice_id: "Voice2c1bd04c1761210837",
          speed: 1,
          vol: 1.5,
          pitch: 0,
        },
        output_format: "url",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (!result.data?.audio?.url) {
      console.error("No audio URL in response:", result);
      throw new Error("No audio URL received from fal.ai");
    }

    return Response.json({
      audioUrl: result.data.audio.url,
      durationMs: result.data.duration_ms,
      requestId: result.requestId,
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return Response.json(
      {
        error: "Failed to generate audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
