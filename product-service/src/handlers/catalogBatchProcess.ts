import type {
  Context,
  SQSEvent,
  Handler,
} from "aws-lambda";
import { v4 as uuid } from "uuid";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDB();

export const handler: Handler = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  for (let record of event.Records) {
    const product = JSON.parse(record.body);

    const productItem = {
      id: uuid(),
      title: product.title,
      description: product.description,
      price: Number(product.price),
    };

    const stockItem = {
      product_id: productItem.id,
      count: Number(product.count),
    }

    await dynamoDB.putItem({
      TableName: process.env.PRODUCTS_TABLE_NAME,
      Item: marshall(productItem),
    })
    await dynamoDB.putItem({
      TableName: process.env.STOCKS_TABLE_NAME,
      Item: marshall(stockItem),
    })
  }
};
