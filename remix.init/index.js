const { execSync } = require("child_process");
const { platform, arch } = require("os");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const inquirer = require("inquirer");

const sort = require("sort-package-json");
const { toLogicalID } = require("@architect/utils");

function getRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

function getBinary() {
  const binaries = {
    linux: "hyper-x86_64-unknown-linux-gnu",
    win32: "hyper-x86_64-pc-windows-msvc.exe",
    darwinx86_64: "hyper-x86_64-apple-darwin",
    darwinarm64: "hyper-aarch64-apple-darwin",
  };

  const os = platform();
  let binary = undefined;

  if (os === "linux" || os === "win32") {
    binary = binaries[os];
  } else if (os === "darwin") {
    // darwin, so if arm64, use aarch64 binary, otherwise use darwin x86-64 binary
    const architecture = arch() === "arm64" ? "arm64" : "x86_64";
    binary = binaries[`${os}${architecture}`];
  }

  return binary;
}

async function main({ rootDirectory }) {
  const APP_ARC_PATH = path.join(rootDirectory, "./app.arc");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const PACKAGE_JSON_PATH = path.join(rootDirectory, "package.json");
  const README_PATH = path.join(rootDirectory, "README.md");
  const GITIGNORE_PATH = path.join(rootDirectory, ".gitignore");
  const WORKFLOW_PATH = path.join(rootDirectory, ".github", "workflows", "deploy.yml");

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);

  const APP_NAME = (DIR_NAME + "-" + SUFFIX)
    // get rid of anything that's not allowed in an app name
    .replace(/[^a-zA-Z0-9-_]/g, "-");

  const [appArc, env, packageJson, readme, gitignore, workflow] = await Promise.all([
    fs.readFile(APP_ARC_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    fs.readFile(PACKAGE_JSON_PATH, "utf-8"),
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(GITIGNORE_PATH, "utf-8"),
    fs.readFile(WORKFLOW_PATH, "utf-8"),
  ]);

  const newPackageJson =
    JSON.stringify(sort({ ...JSON.parse(packageJson), name: APP_NAME }), null, 2) + "\n";

  await Promise.all([
    fs.writeFile(APP_ARC_PATH, appArc.replace("alternative-stack", APP_NAME)),
    /**
     * We treat the stack as a lib and don't include the lockfile in source control.
     * But when it is cloned, the stack becomes an application and thus _should explicitly_
     * enforce a lockfile, as it is best practice. These replacements achieve that.
     */
    fs.writeFile(GITIGNORE_PATH, gitignore.replace(/#<rm>(.|\n)*#<\/rm>\n/, "")),
    fs.writeFile(WORKFLOW_PATH, workflow.replace(/useLockFile: false/g, "useLockFile: true")),
    fs.writeFile(PACKAGE_JSON_PATH, newPackageJson),
    fs.writeFile(
      README_PATH,
      readme.replace(new RegExp("AlternativeStack", "g"), toLogicalID(APP_NAME))
    ),
    fs.rm(path.join(rootDirectory, ".github/ISSUE_TEMPLATE"), {
      recursive: true,
    }),
    fs.rm(path.join(rootDirectory, ".github/PULL_REQUEST_TEMPLATE.md")),
  ]);

  const { HYPER } = await askSetupQuestions({ rootDirectory }).catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      throw error;
    }
  });

  let newEnv = env
    .replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET="${getRandomString(16)}"`)
    .replace(/^HYPER=.*$/m, `HYPER="${HYPER}"`);

  await Promise.all([fs.writeFile(ENV_PATH, newEnv)]);
}

async function askSetupQuestions({ rootDirectory }) {
  let HYPER;

  const res = await inquirer.prompt([
    {
      name: "nano",
      type: "confirm",
      message: "Would you like to use hyper nano ⚡️ for local development?",
      default: true,
    },
  ]);

  if (res.nano) {
    const binary = getBinary();
    if (binary) {
      execSync(
        `curl https://hyperland.s3.amazonaws.com/${binary} -o hyper-nano && chmod +x hyper-nano`,
        {
          stdio: "inherit",
          cwd: rootDirectory,
        }
      );
      HYPER = "http://localhost:6363/notes-dev";
    } else {
      console.log(
        `Platform ${platform()} not supported by hyper nano. Skipping hyper nano binary install...`
      );
    }
  }

  if (!HYPER) {
    const answers = await inquirer.prompt([
      {
        name: "connection",
        type: "input",
        message: "Please provide a hyper cloud application connection string",
        default: "cloud://key:secret@cloud.hyper.io/app-name",
      },
    ]);
    HYPER = answers.connection;
  }

  console.log(`✅ Project is ready! Start development with "npm run dev"`);

  return { HYPER };
}

module.exports = main;
