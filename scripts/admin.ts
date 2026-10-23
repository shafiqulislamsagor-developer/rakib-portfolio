/**
 * Admin account management (run locally against your database):
 *
 *   pnpm admin:create --email you@example.com --name "Your Name"
 *   pnpm admin:reset-password --email you@example.com
 *
 * The password is read from a hidden prompt, or from ADMIN_PASSWORD for
 * non-interactive use. There is intentionally no public sign-up endpoint.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { loadEnv } from "./_env";

loadEnv();

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
}

function promptHidden(question: string) {
  return new Promise<string>((resolve) => {
    let muted = false;
    const output = new Writable({
      write(chunk, _encoding, callback) {
        if (!muted) process.stdout.write(chunk);
        callback();
      },
    });
    const rl = createInterface({ input: process.stdin, output, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (!process.stdin.isTTY) {
    throw new Error("No TTY available. Set ADMIN_PASSWORD for non-interactive use.");
  }
  const password = await promptHidden("Password: ");
  const confirm = await promptHidden("Confirm password: ");
  if (password !== confirm) throw new Error("Passwords do not match.");
  return password;
}

async function main() {
  const command = process.argv[2];
  const email = argument("email");
  if (!email || !["create", "reset-password"].includes(command ?? "")) {
    console.log('Usage: tsx scripts/admin.ts <create|reset-password> --email <email> [--name "Name"]');
    process.exit(1);
  }

  const { passwordPolicy } = await import("@/lib/validation/admin");
  const { createAdminUser, resetAdminPassword } = await import("@/lib/auth/service");
  const { disconnectDB } = await import("@/lib/db/connect");

  const password = await readPassword();
  const check = passwordPolicy.safeParse(password);
  if (!check.success) throw new Error(check.error.issues[0]?.message ?? "Password does not meet the policy.");

  if (command === "create") {
    const user = await createAdminUser({ email, name: argument("name") ?? email.split("@")[0], password });
    console.log(`Created ${user.role} account for ${user.email}.`);
  } else {
    const user = await resetAdminPassword(email, password);
    console.log(`Password reset for ${user.email}. All existing sessions were signed out.`);
  }
  await disconnectDB();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
