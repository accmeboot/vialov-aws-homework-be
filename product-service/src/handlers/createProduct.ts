import type {
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
  Handler,
} from "aws-lambda";
import { v4 as uuid } from 'uuid';
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {validateRequiredFields} from "../lib/validation";

const dynamoDB = new DynamoDB();

const unprocessableEntityResponse = {
  statusCode: 422,
  body: JSON.stringify({
    message: 'body is unprocessable'
  }),
}

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  _context: Context
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.body) {
    try {
      const body: Record<string, string> = JSON.parse(event.body);
      const missingFields = validateRequiredFields(body, ['title', 'description', 'price', 'count']);

      if (missingFields.length > 0) {
        const response = missingFields.reduce<Record<string, string>>((acc, field) => {
          return {
            ...acc,
            [field]: `${field} is required`,
          }
        }, {})

        return {
          statusCode: 400,
          body: JSON.stringify(response)
        }
      }

      const productItem = {
        id: uuid(),
        title: body.title,
        description: body.description,
        price: Number(body.price),
      };

      const stockItem = {
        product_id: productItem.id,
        count: body.count,
      }

      await dynamoDB.putItem({
        TableName: process.env.PRODUCTS_TABLE_NAME,
        Item: marshall(productItem),
      })
      await dynamoDB.putItem({
        TableName: process.env.STOCKS_TABLE_NAME,
        Item: marshall(stockItem),
      })

      return {
        statusCode: 201,
        body: JSON.stringify({
          productId: productItem.id,
        }),
      }
    } catch {
      return unprocessableEntityResponse;
    }
  }

  return unprocessableEntityResponse;
};
