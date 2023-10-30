import type {
  Context,
  S3Event,
  Handler,
} from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';

import csvParser from "csv-parser";

const s3 = new S3Client({});

export const handler: Handler = async (
  event: S3Event,
  context: Context
): Promise<string> => {
  const Key = event.Records[0].s3.object.key;
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key,
  })

  try {
    const response = await s3.send(command);
    const results: string[] = [];

    if (response.Body) {
      const buffer = Buffer.from(await response.Body.transformToByteArray());

      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.info(results);
        });
    }
  } catch (e) {
    console.error(e);
  }

  return context.logStreamName
};
