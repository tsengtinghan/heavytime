import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, title } = await request.json();

    if (!imageUrl || !title) {
      return Response.json(
        { error: "Missing imageUrl or title" },
        { status: 400 }
      );
    }

    // Fetch the image to convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return Response.json({ error: "Failed to fetch image" }, { status: 400 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Determine image type from URL or content-type
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.includes("png")
      ? "image/png"
      : contentType.includes("gif")
      ? "image/gif"
      : contentType.includes("webp")
      ? "image/webp"
      : "image/jpeg";

    // Call Anthropic API with vision
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: `You will be given an image and a title. Write a 4–6 line poem that tells a story.
The style should resemble 夏宇 (Hsia Yu), e.e. cummings, and Chen Chen — experimental, fragmentary, and emotionally charged.

given: bedtime story
return:
Yeah, tell me again/
how you feel it. tell me again how it fills
the chest, fills the head, fills the
lung. Tell me again 
 
given: lets love until we can't
return:
You know that love? that falling-to-your-knee love?
That where'd-the-water-go love? That
hold-me-close-i'll never-leave-i-know-your-favorite
coffee-creamer-love?

given: you have dangerous heartbeats
return:
1. if i love You 
(thickness means worlds inhabited by roamingly stern bright faeries
2. if you love
me) distance is mind carefully luminous with innumerable gnomes of complete dream
3. if we love each (shyly)
other, what clouds do or Silently
Flowers resembles beauty
less than our breathing

given: I see your heart in my memory 
return:
promise me you won't forget 
then I can too
forever remember
tie a knot on the heart
then the beats become butterfly

Return only the poem, remember to include elements or style/vibe from the given image in the poem.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: title,
            },
          ],
        },
      ],
    });

    // Extract the poem text from the response
    const poemText =
      message.content[0].type === "text" ? message.content[0].text : "";

    return Response.json({
      poem: poemText,
      title: title,
    });
  } catch (error) {
    console.error("Error generating poem:", error);
    return Response.json(
      {
        error: "Failed to generate poem",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
