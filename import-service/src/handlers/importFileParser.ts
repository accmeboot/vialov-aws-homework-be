import type {
  Context,
  S3Event,
  Handler,
} from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from 'stream';

import csvParser from "csv-parser";
import { SendMessageCommand, type SendMessageCommandOutput, SQSClient } from "@aws-sdk/client-sqs";

const s3 = new S3Client({});
const client = new SQSClient({});

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

    if (response.Body) {
      const buffer = Buffer.from(await response.Body.transformToByteArray());
      const results: Promise<SendMessageCommandOutput>[] = [];

      const waitForStream = new Promise<void>((resolve) => {
        Readable.from(buffer)
          .pipe(csvParser())
          .on('data', (data) => {
            const command = new SendMessageCommand({
              QueueUrl: process.env.SQS_URL,
              DelaySeconds: 1,
              MessageBody: JSON.stringify(data),
            });

            results.push(client.send(command))
          })
        .on('end', () => { resolve() });

      })

      await waitForStream;
      await Promise.all(results);
    }
  } catch (e) {
    console.error(e);
  }

  return context.logStreamName
};
