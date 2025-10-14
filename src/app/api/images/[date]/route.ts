import { S3Client, paginateListObjectsV2 } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";

const S3 = new S3Client({
  region: "auto",
  endpoint: "https://t3.storage.dev",
  s3ForcePathStyle: false,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const bucketName = "mypublicbucket";
    const prefix = `art173/heavytime/${date}/`;

    const paginator = paginateListObjectsV2(
      { client: S3, pageSize: 100 },
      { 
        Bucket: bucketName,
        Prefix: prefix,
      }
    );

    const imageUrls: string[] = [];

    for await (const page of paginator) {
      if (page.Contents) {
        page.Contents.forEach((obj) => {
          if (obj.Key) {
            // Filter for common image extensions
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(obj.Key);
            if (isImage) {
              imageUrls.push(`https://${bucketName}.t3.storage.dev/${obj.Key}`);
            }
          }
        });
      }
    }

    return Response.json({ 
      images: imageUrls,
      date: date,
      count: imageUrls.length 
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return Response.json(
      { 
        error: 'Failed to fetch images',
        images: [],
        date: (await params).date,
        count: 0 
      }, 
      { status: 500 }
    );
  }
}