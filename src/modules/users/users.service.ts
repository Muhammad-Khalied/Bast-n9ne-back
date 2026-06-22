import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await prisma.user.update({ where: { id: userId }, data });
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new AppError("Invalid password", 401, "INVALID_PASSWORD");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async listAddresses(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async addAddress(
    userId: string,
    data: {
      fullName: string;
      phone: string;
      street: string;
      city: string;
      state: string;
      country?: string;
      label?: string;
      isDefault?: boolean;
    }
  ) {
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        country: data.country || "Egypt",
        label: data.label,
        isDefault: data.isDefault || false,
      },
    });
  }

  async updateAddress(userId: string, id: string, data: Record<string, any>) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return prisma.address.update({ where: { id }, data });
  }

  async removeAddress(userId: string, id: string) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");
    await prisma.address.delete({ where: { id } });
  }

  async adminList(page = 1, perPage = 20) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async adminGet(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return user;
  }

  async adminUpdateStatus(userId: string, status: string) {
    return prisma.user.update({ where: { id: userId }, data: { status: status as any } });
  }

  async adminUpdateRole(userId: string, role: string) {
    return prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  }
}
