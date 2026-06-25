import { env } from "./env";

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const clientOrigin = env.CLIENT_ORIGIN?.replace(/\/$/, "");

    if (
      env.CLIENT_ORIGIN === "*" ||
      origin === clientOrigin || 
      (env.NODE_ENV === "development" && origin.startsWith("http://localhost:"))
    ) {
      callback(null, true);
    } else {
      console.error(`CORS BLOCKED ORIGIN: "${origin}" - Expected: "${clientOrigin}"`);
      callback(new Error(`Not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
