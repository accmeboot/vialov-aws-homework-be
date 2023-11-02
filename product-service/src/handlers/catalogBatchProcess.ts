import type {
  Context,
  SQSEvent,
  Handler,
} from "aws-lambda";
import { v4 as uuid } from "uuid";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDB = new DynamoDB();
const sns = new SNSClient({});

export const handler: Handler = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  const products = [];
  const stocks = [];

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
    });
    await dynamoDB.putItem({
      TableName: process.env.STOCKS_TABLE_NAME,
      Item: marshall(stockItem),
    });
    products.push(productItem);
    stocks.push(stockItem);
  }

  const message = `Created products: ${JSON.stringify(products)}\nCreated stocks: ${JSON.stringify(stocks)}`;
  const command = new PublishCommand({
    Subject: 'New products ware created',
    Message: message,
    TopicArn: process.env.SNS_ARN
  });
  await sns.send(command);
};
