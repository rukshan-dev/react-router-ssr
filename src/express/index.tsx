import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import {
  createStaticHandler,
  createStaticRouter,
  RouteObject,
  StaticRouterProvider,
} from "react-router";
import createFetchRequest from "./createFetchRequest";
import { renderToString } from "react-dom/server";
import { RuntimeConfigs } from "repacked";
import { AssetsProvider } from "../scripts";
import { convertResponseToExpress, responseToJson } from "./responses";

type Options = {
  requestContext: unknown;
};

type SerializableResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

const expressSSRMiddleware =
  (
    routes: RouteObject[],
    config: RuntimeConfigs,
    options: Partial<Options> = {}
  ) =>
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    if (/^(?!.*\.\w+$).+$/.test(req.path) && !req.path.startsWith("/__")) {
      const { query, dataRoutes, queryRoute } = createStaticHandler(routes);
      const fetchRequest = createFetchRequest(req, res);

      if (req.headers.accept?.toLowerCase() === "application/json") {
        const data = await queryRoute(fetchRequest, {
          requestContext: options.requestContext,
        });
        if (data instanceof Response) {
          res.set("x-serialized-response", "true");
          res.send(await responseToJson(data));
          return;
        }
        res.send(data);
        return;
      }

      let context = await query(fetchRequest, {
        requestContext: options.requestContext,
      });

      if (context instanceof Response) {
        return await convertResponseToExpress(context, res);
      }

      let router = createStaticRouter(dataRoutes, context);
      const assets = await config.getClientManifest();
      res.send(
        renderToString(
          <AssetsProvider assets={assets}>
            <StaticRouterProvider router={router} context={context} />
          </AssetsProvider>
        )
      );
      return;
    }
    return next();
  };

export default expressSSRMiddleware;
