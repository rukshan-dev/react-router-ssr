import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export default function createFetchRequest(
  req: ExpressRequest,
  res: ExpressResponse
): Request {
  let origin = `${req.protocol}://${req.get("host")}`;
  let url = new URL(req.originalUrl || req.url, origin);
  let controller = new AbortController();
  res.on("close", () => controller.abort());

  let headers = new Headers();

  for (let [key, values] of Object.entries(req.headers)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  let init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    //convert json request to x-www-form-urlencoded to handle actions.
    if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
      init.body = new URLSearchParams(req.body);
    } else {
      init.body = req.body;
    }
  }

  return new Request(url.href, init);
}
