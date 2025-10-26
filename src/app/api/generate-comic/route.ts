import { fal } from "@fal-ai/client";
import { NextRequest } from "next/server";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { poem, imageUrl, storyId } = await request.json();

    if (!poem || !imageUrl || !storyId) {
      return Response.json(
        { error: "Missing poem, imageUrl, or storyId" },
        { status: 400 }
      );
    }

    // Create the prompt with the poem
    const prompt = `Create a four-panel comic strip in a simple, consistent manga style.
Use the provided image as the starting background of the story, keeping it exactly as it is—unchanged and realistic.
Introduce a manga-style character or motif into this scene, as if they've stepped out of a manga and into reality.
Continue the story visually across the next three panels, let the character interact with the environment.

Do not include any text, speech bubbles, or sound effects

Use the elements from the following poem as character and narrative inspiration:
${poem}`;

    // Call fal.ai Nano Banana Edit API
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt: prompt,
        image_urls: [imageUrl],
        num_images: 1,
        output_format: "jpeg",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (!result.data?.images?.[0]?.url) {
      console.error("No comic image URL in response:", result);
      throw new Error("No comic image received from fal.ai");
    }

    return Response.json({
      comicUrl: result.data.images[0].url,
      description: result.data.description,
      requestId: result.requestId,
    });
  } catch (error) {
    console.error("Error generating comic:", error);
    return Response.json(
      {
        error: "Failed to generate comic",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
