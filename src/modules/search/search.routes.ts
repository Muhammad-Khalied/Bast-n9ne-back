import { Router } from "express";
import { search, suggestions } from "./search.controller";

export const searchRoutes = Router();

searchRoutes.get("/", search);
searchRoutes.get("/suggestions", suggestions);
