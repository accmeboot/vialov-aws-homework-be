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
      const missingFields = validateRequiredFields(body, ['userId', 'productId', 'count']);
      let isError = false;

      if (missingFields.length > 0) {
        const responseBody = getValidationError(missingFields);
        return returnResponse(400, responseBody);
      }

      const client = new Client(DB_OPTIONS);
      let cartId = null;

      try {
        await client.connect();
        // check if there is already a cart for this user, create if not
        const { rowCount: cartsRowCount, rows} = await client.query(
          'SELECT id FROM carts WHERE user_id = $1',
          [body.userId]);

        if (cartsRowCount === null || cartsRowCount === 0) {
          const { rows } = await client.query(
            'INSERT INTO carts (user_id) VALUES ($1) RETURNING 1',
            [body.userId]);

          cartId = rows[0].id;
        }
        cartId = rows[0].id;

        // add product
        const { rowCount } = await client.query(
          'INSERT INTO cart_items (cart_id, product_id, count) VALUES ($1, $2, $3)',
          [cartId, body.productId, body.count]
          );
        if (rowCount === null || rowCount === 0) {
         isError = true;
        }

      } catch (e) {
        isError = true;
        console.error(e);
      } finally {
        await client.end();
      }

      if (isError) {
        return returnResponse(500, { message: 'internal server error' });
      }

      return returnResponse(201, { cartId });
    } catch {
      return unprocessableEntityResponse;
    }
  }

  return unprocessableEntityResponse;
};
