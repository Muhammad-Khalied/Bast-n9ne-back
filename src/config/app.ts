import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { corsOptions } from "./cors";
import { requestLogger } from "../middleware/requestLogger";
import { rateLimiter } from "../middleware/rateLimiter";
import { errorHandler } from "../middleware/errorHandler";
import { routes } from "../routes";

export const createApp = () => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(rateLimiter);

  // Disable caching for API responses
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  app.use("/api/v1", routes);
  app.use(errorHandler);

  return app;
};
