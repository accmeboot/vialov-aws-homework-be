import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerHandler } from 'aws-lambda';

export const handler: APIGatewayTokenAuthorizerHandler = async (event) => {
  const { authorizationToken, methodArn } = event;

  if (!authorizationToken) {
    throw new Error('Missing authorization token');
  }

  const encodedCredentials = authorizationToken.split(' ')[1];
  const buff = Buffer.from(encodedCredentials, 'base64');
  const [username, password] = buff.toString('utf-8').split(':');

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (username === expectedUser && password === expectedPassword) {
    return generatePolicy(encodedCredentials, 'Allow', methodArn);
  }

  return generatePolicy(encodedCredentials, 'Deny', methodArn);
};

const generatePolicy = (principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult => {
  return  {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
