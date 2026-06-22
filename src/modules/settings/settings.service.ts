import { prisma } from "../../config/database";

export class SettingsService {
  async getAll() {
    return prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });
  }

  async getByGroup(group: string) {
    return prisma.siteSetting.findMany({
      where: { group },
    });
  }

  async update(key: string, value: any, group: string = "general") {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value, group },
      create: { key, value, group },
    });
  }

  async updateMany(settings: { key: string; value: any; group: string }[]) {
    return Promise.all(
      settings.map((s) =>
        prisma.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, group: s.group },
          create: { key: s.key, value: s.value, group: s.group },
        })
      )
    );
  }
}
