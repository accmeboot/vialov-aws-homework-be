import { Client } from "pg";
import { getValidationError, validateRequiredFields } from "../lib/validation";
import { DB_OPTIONS, returnResponse, unprocessableEntityResponse } from "../lib/const";

import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
  _context
) => {
  if (event.body) {
    try {
      const body: Record<string, string> = JSON.parse(event.body);
      const missingFields = validateRequiredFields(body, ['productId', 'cartId']);
      let isError = false;

      if (missingFields.length > 0) {
        const responseBody = getValidationError(missingFields);
        return returnResponse(400, responseBody);
      }

      const client = new Client(DB_OPTIONS);

      try {
        await client.connect();
        await client.query(
          'DELETE FROM cart_items WHERE product_id = $1 AND cart_id = $2',
          [body.productId, body.cartId]
        );
      } catch (e) {
        isError = true;
        console.error(e);
      } finally {
        await client.end();
      }

      if (isError) {
        return returnResponse(500, { message: 'internal server error' });
      }

      return returnResponse(204);
    } catch {
      return unprocessableEntityResponse;
    }
  }

  return unprocessableEntityResponse;
};
