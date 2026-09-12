const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function freePort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const lines = output.trim().split("\n");
      const pids = new Set();
      for (const line of lines) {
        if (line.includes("LISTENING")) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`Freed port ${port} by stopping stale process PID ${pid}.`);
        } catch (_) {}
      }
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
    }
  } catch (_) {}
}

function runNodeScript(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script)], {
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: false,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

function waitForMongo(uri, attempts = 30) {
  const address = new URL(uri);
  const host = address.hostname;
  const port = Number(address.port);

  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const probe = () => {
      const socket = net.createConnection({ host, port });
      let settled = false;
      const retry = () => {
        if (settled) return;
        settled = true;
        socket.destroy();
        remaining -= 1;
        if (remaining <= 0) {
          reject(new Error(`MongoDB did not accept connections at ${host}:${port}`));
          return;
        }
        setTimeout(probe, 250);
      };
      socket.once("connect", () => {
        if (settled) return;
        settled = true;
        socket.end();
        resolve();
      });
      socket.once("error", retry);
      socket.setTimeout(1000, retry);
    };
    probe();
  });
}

function startDevServers(mongoUri) {
  const apiPort = process.env.PORT || "4001";
  const nextPort = process.env.NEXT_PORT || "3002";
  const apiUrl = `http://localhost:${apiPort}`;

  freePort(apiPort);
  freePort(nextPort);

  const env = {
    ...process.env,
    MONGODB_URI: mongoUri,
    PORT: apiPort,
    CLIENT_URL: `http://localhost:${nextPort}`,
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_SOCKET_URL: apiUrl,
  };

  const next = spawn("npx", ["next", "dev", "-p", nextPort], {
    env,
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  const server = spawn(process.execPath, [path.join(__dirname, "..", "server", "index.js")], {
    env,
    stdio: "inherit",
    shell: false,
  });

  function shutdown() {
    next.kill();
    server.kill();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  next.on("close", (code) => {
    server.kill();
    process.exit(code ?? 0);
  });
  server.on("close", (code) => {
    next.kill();
    process.exit(code ?? 0);
  });
}

async function main() {
  console.log("Starting embedded MongoDB (no local install required)...\n");

  const { MongoMemoryServer } = require("mongodb-memory-server");
  const dbPath = process.env.POKECARD_DB_PATH || path.join(os.tmpdir(), "pokecard-mongodb-dev");
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbPath,
      storageEngine: "wiredTiger",
    },
  });
  const mongoUri = mongod.getUri("pokecard");

  console.log(`MongoDB ready at ${mongoUri}\n`);
  await waitForMongo(mongoUri);

  process.on("exit", () => mongod.stop());
  process.on("SIGINT", async () => {
    await mongod.stop();
  });

  console.log("Seeding database from the card source...\n");
  try {
    await runNodeScript("seed.js", { MONGODB_URI: mongoUri });
  } catch (err) {
    console.warn("\nTCGdex sync failed. Trying the curated local card catalog instead.");
    console.warn(err.message);
    try {
      await runNodeScript("seed-fallback.js", { MONGODB_URI: mongoUri });
    } catch (fallbackErr) {
      console.error("Fallback card seeding also failed. Startup stopped.");
      console.error(fallbackErr.message);
      process.exit(1);
    }
  }

  const apiPort = process.env.PORT || "4001";
  const nextPort = process.env.NEXT_PORT || "3002";
  console.log(`\nStarting Next.js (http://localhost:${nextPort}) and API (http://localhost:${apiPort})...\n`);
  startDevServers(mongoUri);
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
