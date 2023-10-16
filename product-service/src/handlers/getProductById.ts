import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoDB = new DynamoDB();

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  let product = null;

  if (event?.pathParameters && 'productId' in event.pathParameters && event.pathParameters.productId) {
    const productItem = await dynamoDB.getItem({
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Key: {
          id: {
            S: event.pathParameters.productId,
          },
        }
      }
    );

    const stockItem = await dynamoDB.getItem({
      TableName: process.env.STOCKS_TABLE_NAME,
      Key: {
        product_id: {
          S: event.pathParameters.productId,
        }
      },
    })

    if (productItem.Item) {
      product = unmarshall(productItem.Item)

      if (stockItem.Item?.count?.N) {
        product = {
          ...product,
          count: stockItem.Item.count.N,
        }
      }
    }
  }

  if (product) {
    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({
      error: 'not found',
    })
  }
};
