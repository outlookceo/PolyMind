import { db } from "@/lib/db";

export async function getCurrentUser() {
  const email = process.env.DEMO_USER_EMAIL ?? "demo@polymind.local";

  return db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: process.env.DEMO_USER_NAME ?? "PolyMind Demo User",
      avatarUrl: null
    }
  });
}
