import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import { signAccessToken, signRefreshToken } from "../../utils/tokens";
import { env } from "../../config/env";
import { LoginInput, RegisterInput } from "./auth.types";
import jwt from "jsonwebtoken";

const parseDurationToMs = (value: string) => {
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
};

const refreshTtlMs = parseDurationToMs(env.REFRESH_TOKEN_TTL);

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_IN_USE");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    const adminRefreshTtlMs = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
    const ttl = user.role === "ADMIN" ? adminRefreshTtlMs : refreshTtlMs;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken, expiresIn: env.ACCESS_TOKEN_TTL };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const match = await bcrypt.compare(input.password, user.passwordHash);
    if (!match) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    if (user.status !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_INACTIVE");
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    const adminRefreshTtlMs = 100 * 365 * 24 * 60 * 60 * 1000;
    const ttl = user.role === "ADMIN" ? adminRefreshTtlMs : refreshTtlMs;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken, expiresIn: env.ACCESS_TOKEN_TTL };
  }

  async refresh(token?: string) {
    if (!token) {
      throw new AppError("Refresh token required", 401, "REFRESH_REQUIRED");
    }

    let payload: { sub: string };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
    } catch {
      throw new AppError("Refresh token invalid", 401, "REFRESH_INVALID");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError("Refresh token expired", 401, "REFRESH_EXPIRED");
    }
    if (stored.userId !== payload.sub) {
      throw new AppError("Refresh token invalid", 401, "REFRESH_INVALID");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = signAccessToken(stored.userId, user.role);
    const refreshToken = signRefreshToken(stored.userId);

    const adminRefreshTtlMs = 100 * 365 * 24 * 60 * 60 * 1000;
    const ttl = user.role === "ADMIN" ? adminRefreshTtlMs : refreshTtlMs;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + ttl),
      },
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { accessToken, refreshToken, expiresIn: env.ACCESS_TOKEN_TTL, user: safeUser };
  }

  async logout(token?: string) {
    if (!token) {
      return;
    }

    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }
}
