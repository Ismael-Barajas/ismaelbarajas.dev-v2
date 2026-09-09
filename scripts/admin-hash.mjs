// Prints a bcrypt hash for ADMIN_PASSWORD_HASH.
// Usage: npm run admin:hash            (prompts, input hidden)
//        npm run admin:hash -- <pw>    (no prompt)
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

const fromArg = process.argv[2];

const ask = () =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const origWrite = rl._writeToOutput;
    rl.question("Admin password: ", (answer) => {
      rl._writeToOutput = origWrite;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });
    // Mask typed characters.
    rl._writeToOutput = (s) => {
      if (s.startsWith("Admin password: ")) origWrite.call(rl, s);
    };
  });

const password = fromArg ?? (await ask());
if (!password) {
  console.error("No password given.");
  process.exit(1);
}
const hash = await bcrypt.hash(password, 12);
console.log("\nAdd to your environment:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
