import { Response as ExpressResponse } from "express";

type SerializableResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

export const responseToJson = async (
  response: Response
): Promise<SerializableResponse> => {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const body = await response.text();
  return {
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
  };
};

export const convertResponseToExpress = async (
  fetchRes: Response,
  expressRes: ExpressResponse
) => {
  // Set headers
  fetchRes.headers.forEach((value, key) => {
    expressRes.setHeader(key, value);
  });

  // Set status
  expressRes.status(fetchRes.status);

  // Send body
  const buffer = await fetchRes.arrayBuffer();
  expressRes.send(Buffer.from(buffer));
};
