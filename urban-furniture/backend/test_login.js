require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function testLogin() {
  const email = "deepikadevaraj413@gmail.com";
  const testPassword = "Deepika@123"; // CHANGE THIS TO YOUR ACTUAL PASSWORD
  
  console.log("\n=== LOGIN FLOW DIAGNOSTIC ===\n");
  console.log("[1] Searching for user with email:", JSON.stringify(email));

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log("[FAIL] No user found with that email.");
      console.log("       The lookup failed - email mismatch.");
      return;
    }

    console.log("[2] User found:");
    console.log("    name:", user.name);
    console.log("    email:", JSON.stringify(user.email));
    console.log("    role:", user.role);
    console.log("    status:", user.status);
    console.log("    hasPasswordHash:", !!user.passwordHash);

    if (user.role !== "ADMIN") {
      console.log("[FAIL] User is not an ADMIN (role =", user.role, ")");
      return;
    }

    if (user.status !== "ACTIVE") {
      console.log("[FAIL] Admin is not ACTIVE (status =", user.status, ")");
      return;
    }

    if (!user.passwordHash) {
      console.log("[FAIL] No passwordHash stored!");
      return;
    }

    console.log("[3] Testing bcrypt.compare with test password...");
    const match = await bcrypt.compare(testPassword, user.passwordHash);
    console.log("    Password match:", match ? "YES - password is correct!" : "NO - password does not match");

    if (!match) {
      console.log("\n[ROOT CAUSE] The password you entered does not match what was stored.");
      console.log("    Possible causes:");
      console.log("    1. You registered with a DIFFERENT password than what you are typing now.");
      console.log("    2. The password was re-hashed twice during registration (double-hash bug).");
      console.log("    3. There are leading/trailing spaces in the stored or entered password.");
      
      // Check if the passwordHash itself looks like a bcrypt hash that was hashed again
      const isDoubleHashed = user.passwordHash.startsWith("$2b$") && user.passwordHash.length === 60;
      console.log("    passwordHash appears to be valid bcrypt:", isDoubleHashed ? "YES" : "NO - CORRUPTED HASH!");
    }
  } catch(e) {
    console.error("[ERROR]", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
testLogin();
