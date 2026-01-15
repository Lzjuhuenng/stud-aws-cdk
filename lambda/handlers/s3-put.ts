import type { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Node.js 18+ / 20 では AWS SDK v3 を使うのが定番
const s3 = new S3Client({});

// stream → string 変換ユーティリティ
async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    console.log("S3 PUT detected:", { bucket, key });

    // 必要ならオブジェクト本体を取得
    const resp = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const body = await streamToString(resp.Body);
    console.log("Object content (first 500 chars):", body.slice(0, 500));

    // TODO: ここで解析/変換/DB投入/別S3へ移動…など
  }
};
