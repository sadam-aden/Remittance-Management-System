/**
 * Creates the first admin login. Run once after migrating:
 *   npm run create-admin
 * Override defaults with env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.ADMIN_NAME ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists (id ${existing.id}). Nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: "admin" },
  });

  console.log(`Created admin user ${user.email} (id ${user.id}).`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Default password used: ${password} — change it after first login.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
