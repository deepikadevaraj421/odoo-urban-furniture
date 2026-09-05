const { check, validationResult } = require("express-validator");
const { normalizeEmail } = require("validator");

// Simulate what express-validator normalizeEmail does
const email = "deepikadevaraj413@gmail.com";
const normalized = normalizeEmail(email);
console.log("Original email:", JSON.stringify(email));
console.log("After normalizeEmail():", JSON.stringify(normalized));
console.log("Match:", email === normalized ? "SAME (no issue)" : "DIFFERENT! This is the bug.");

// Also test common normalization scenarios
const tests = [
  "Deepikadevaraj413@gmail.com",
  "deepikadevaraj413@Gmail.com",
  "deepika.devaraj413@gmail.com",
  "DEEPIKADEVARAJ413@gmail.com",
];
console.log("\nNormalization tests:");
tests.forEach(t => {
  const n = normalizeEmail(t);
  console.log("  Input:", JSON.stringify(t), "->", JSON.stringify(n));
});
