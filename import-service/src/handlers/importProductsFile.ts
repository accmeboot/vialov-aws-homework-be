import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.queryStringParameters?.name) {
    const signedURL = `https://${process.env.BUCKET_NAME}.s3.eu-central-1.amazonaws.com/${process.env.PREFIX_NAME}`;
    let isSuccess = false;
    const fileName = event.queryStringParameters.name;
    const command = new HeadObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `${process.env.PREFIX_NAME}/${fileName}.csv`,
    })

    try {
      const response = await s3.send(command);

      if (response.$metadata.httpStatusCode === 200) {
        isSuccess = true;
      }
    } catch (err) {
      console.error(err);
    }

    if (isSuccess) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          url: `${signedURL}/${fileName}.csv`,
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'no such file',
      }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: '"name" query parameter is required',
    }),
  }
};

