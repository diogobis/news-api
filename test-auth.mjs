import "dotenv/config";
import { register, login } from "./src/services/auth.js";

async function main() {
  try {
    const result = await register("alice@test.com", "alice", "password123");
    console.log("REGISTER OK:", result.user.email, result.user.username, "token:", result.token.slice(0, 20) + "...");
  } catch (err) {
    console.log("REGISTER FAIL:", err.message || err);
  }

  try {
    const result2 = await register("alice@test.com", "alice", "password123");
    console.log("DUPLICATE FAIL (expected):", result2.message || result2);
  } catch (err) {
    console.log("DUPLICATE OK - rejected:", err.message || err);
  }

  try {
    const result3 = await login("alice", "password123");
    console.log("LOGIN BY USERNAME OK:", result3.user.email, "token:", result3.token.slice(0, 20) + "...");
  } catch (err) {
    console.log("LOGIN FAIL:", err.message || err);
  }

  try {
    const result4 = await login("alice@test.com", "password123");
    console.log("LOGIN BY EMAIL OK:", result4.user.email, "token:", result4.token.slice(0, 20) + "...");
  } catch (err) {
    console.log("LOGIN BY EMAIL FAIL:", err.message || err);
  }

  try {
    const result5 = await login("alice", "wrongpassword");
    console.log("WRONG PASSWORD FAIL (expected):", result5.message || result5);
  } catch (err) {
    console.log("WRONG PASSWORD OK - rejected:", err.message || err);
  }
}

main().catch(console.error);
