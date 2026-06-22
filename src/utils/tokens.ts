import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../config/env";

export const signAccessToken = (userId: string, role: string): string => {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET as Secret, options);
};

export const signRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, jti: randomUUID() }, env.JWT_REFRESH_SECRET as Secret, options);
};

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET as Secret) as { sub: string; role: string };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET as Secret) as { sub: string };
