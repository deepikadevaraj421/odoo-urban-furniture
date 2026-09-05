require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  try {
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    const safeUrl = dbUrl.replace(/:([^:@]+)@/, ":***@");
    console.log("[DB] DATABASE_URL (masked):", safeUrl);
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    console.log("[DB] Admin records found:", admins.length);
    for (const a of admins) {
      console.log("---");
      console.log("  id:", a.id);
      console.log("  name:", a.name);
      console.log("  email:", JSON.stringify(a.email));
      console.log("  role:", a.role);
      console.log("  status:", a.status);
      console.log("  hasPasswordHash:", !!a.passwordHash && a.passwordHash.length > 0);
      console.log("  passwordHash prefix:", a.passwordHash ? a.passwordHash.substring(0,7) + "..." : "NULL");
    }
    const allUsers = await prisma.user.count();
    console.log("[DB] Total users in DB:", allUsers);
  } catch(e) {
    console.error("[ERROR]", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
