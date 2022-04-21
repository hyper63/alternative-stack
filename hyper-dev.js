const { existsSync } = require("fs");
const { execSync } = require("child_process");

if (existsSync("./hyper-nano")) {
  void execSync("./hyper-nano --domain='notes-dev' --experimental --data --cache", {
    stdio: "inherit",
    cwd: __dirname,
  });
} else {
  console.log(`No hyper-nano found. Noop`);
}
