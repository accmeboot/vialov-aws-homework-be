export const DB_NAME = process.env.DB_NAME || 'postgres';
export const DB_USER = process.env.DB_USER || 'postgres';
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = Number(process.env.DB_PORT) || 5432;
export const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

export const DB_OPTIONS = {
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimoutMillis: 5000,
}

export const unprocessableEntityResponse = {
  statusCode: 422,
  body: JSON.stringify({
    message: 'body is unprocessable'
  }),
}

export const returnResponse = <T>(status: number, body?: T) => ({
  statusCode: status,
  ...(body && { body: JSON.stringify(body) })
})
