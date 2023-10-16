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
  _event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productsScan = await dynamoDB.scan({
    TableName: process.env.PRODUCTS_TABLE_NAME,
  })
  const stocksScan = await dynamoDB.scan({
    TableName: process.env.STOCKS_TABLE_NAME,
  })

  const products = productsScan.Items?.map(product => unmarshall(product));
  const stocks = stocksScan.Items?.map(stock => unmarshall(stock));

  const Items = products?.map(product => {
    let result = {...product};
    const stock = stocks?.find(stock => stock.product_id === product.id);

    if (stock) {
      result = {
        ...result,
        count: stock.count,
      }
    }

    return result;
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      Count: productsScan.Count,
      Items,
    }),
  };
};
