import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall } from "@aws-sdk/util-dynamodb";
import { products } from '../data/products';
import { v4 } from "uuid";

const dynamoDB = new DynamoDB();

export const handler: Handler = async (
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  const formattedProducts = products.map((product) => ({
    ...product,
    id: v4(),
  }));

  await Promise.all(
    formattedProducts.map(async (product) => {

      const params = {
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Item: marshall({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
        }),
      };

      await dynamoDB.putItem(params);
    })
  );

  await Promise.all(
    formattedProducts.map(async ({id, count}) => {
      const params = {
        TableName: process.env.STOCKS_TABLE_NAME,
        Item: marshall({ product_id: id, count, }),
      };

      await dynamoDB.putItem(params)
    })
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'success' }),
  };
};
