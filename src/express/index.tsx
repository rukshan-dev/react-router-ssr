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

const expressSSRMiddleware =
  (routes: RouteObject[], config: RuntimeConfigs) =>
  async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    if (/^(?!.*\.\w+$).+$/.test(req.path) && !req.path.startsWith("/__")) {
      const { query, dataRoutes, queryRoute } = createStaticHandler(routes);
      const fetchRequest = createFetchRequest(req, res);

      if (req.headers.accept?.toLowerCase() === "application/json") {
        const data = await queryRoute(fetchRequest);
        res.send(data);
        return;
      }

      let context = await query(fetchRequest);

      if (context instanceof Response) {
        throw context;
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
