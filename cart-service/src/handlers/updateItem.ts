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
      let updatedItem = null;

      try {
        await client.connect();
        const { rows } = await client.query(
          'UPDATE cart_items SET count = $1 WHERE product_id = $2 AND cart_id = $3 RETURNING 1',
          [body.count, body.productId, body.cartId]
        );

        updatedItem = rows[0];
      } catch (e) {
        isError = true;
        console.error(e);
      } finally {
        await client.end();
      }

      if (isError) {
        return returnResponse(500, { message: 'internal server error' });
      }

      return returnResponse(200, { item: updatedItem });
    } catch {
      return unprocessableEntityResponse;
    }
  }

  return unprocessableEntityResponse;
};
