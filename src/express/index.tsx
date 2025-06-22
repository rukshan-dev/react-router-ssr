import { Request, Response, NextFunction } from "express";
import {
  createStaticHandler,
  createStaticRouter,
  RouteObject,
  StaticRouterProvider,
} from "react-router";
import createFetchRequest from "./createFetchRequest";
import { renderToString } from "react-dom/server";

const expressSSRMiddleware =
  (routes: RouteObject[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
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
      res.send(
        renderToString(
          <StaticRouterProvider router={router} context={context} />
        )
      );
      return;
    }
    return next();
  };

export default expressSSRMiddleware;
