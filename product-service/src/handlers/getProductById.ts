import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { products } from "../data/products";

const findProduct = (id: string) => {
  return products.find((p) => String(p.id) === id)
}

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  let product = null;

  if (event?.pathParameters && 'productId' in event.pathParameters && event.pathParameters.productId) {
    product = findProduct(event.pathParameters.productId)
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
