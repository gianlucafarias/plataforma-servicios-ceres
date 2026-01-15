"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "17.2.3",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run tests/**/*.js --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run tests/**/*.js --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var TIPS = [
      "\u{1F510} encrypt with Dotenvx: https://dotenvx.com",
      "\u{1F510} prevent committing .env to code: https://dotenvx.com/precommit",
      "\u{1F510} prevent building .env in docker: https://dotenvx.com/prebuild",
      "\u{1F4E1} add observability to secrets: https://dotenvx.com/ops",
      "\u{1F465} sync secrets across teammates & machines: https://dotenvx.com/ops",
      "\u{1F5C2}\uFE0F backup and recover secrets: https://dotenvx.com/ops",
      "\u2705 audit secrets and track compliance: https://dotenvx.com/ops",
      "\u{1F504} add secrets lifecycle management: https://dotenvx.com/ops",
      "\u{1F511} add access controls to secrets: https://dotenvx.com/ops",
      "\u{1F6E0}\uFE0F  run anywhere with `dotenvx run -- yourcommand`",
      "\u2699\uFE0F  specify custom .env file path with { path: '/custom/path/.env' }",
      "\u2699\uFE0F  enable debug logging with { debug: true }",
      "\u2699\uFE0F  override existing env vars with { override: true }",
      "\u2699\uFE0F  suppress all logs with { quiet: true }",
      "\u2699\uFE0F  write to custom object with { processEnv: myObject }",
      "\u2699\uFE0F  load multiple .env files with { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs2.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs2.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs2.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports2, module2) {
    "use strict";
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module2.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    "use strict";
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// scripts/worker.ts
var import_bullmq2 = require("bullmq");

// src/lib/redis.ts
function redisConnection() {
  const url = process.env.REDIS_URL || "redis://127.0.0.1:6379/5";
  const prefix = process.env.REDIS_PREFIX || "ceres:queue";
  const opts = {
    maxRetriesPerRequest: null,
    // Requerido por BullMQ
    enableReadyCheck: true
  };
  return {
    connection: __spreadValues(__spreadValues({}, opts), parseRedisUrl(url)),
    prefix
  };
}
function parseRedisUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) : 0,
      password: parsed.password || void 0
    };
  } catch (e) {
    console.warn("REDIS_URL mal formada, usando defaults: 127.0.0.1:6379/5");
    return { host: "127.0.0.1", port: 6379, db: 5 };
  }
}

// src/lib/mail.ts
var import_nodemailer = __toESM(require("nodemailer"));
var smtpHost = process.env.SMTP_HOST;
var smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
var smtpUser = process.env.SMTP_USER;
var smtpPass = process.env.SMTP_PASS;
var smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
var smtpSecureEnv = process.env.SMTP_SECURE;
var smtpSecure = typeof smtpSecureEnv === "string" ? smtpSecureEnv.toLowerCase() === "true" : smtpPort === 465;
var smtpDebug = (process.env.SMTP_DEBUG || "").toLowerCase() === "true";
if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn("SMTP no configurado completamente. Define SMTP_HOST, SMTP_USER y SMTP_PASS en el entorno.");
}
var mailTransporter = import_nodemailer.default.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  // true: SSL (465), false: STARTTLS (587)
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  logger: smtpDebug,
  debug: smtpDebug
});
async function sendMail(options) {
  const { to, subject, html, text, from } = options;
  const info = await mailTransporter.sendMail({
    from: from || smtpFrom,
    to,
    subject,
    html,
    text
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[SMTP] Sent mail to", to, "messageId=", info.messageId);
  }
  return info;
}

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var prisma = global.prismaGlobal || new import_client.PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

// src/jobs/email.worker.ts
async function sendVerificationEmail(data) {
  const { userId, token, email, firstName } = data;
  const vt = await prisma.verificationToken.findFirst({
    where: {
      userId,
      token,
      expiresAt: { gte: /* @__PURE__ */ new Date() }
      // No vencido
    }
  });
  if (!vt) {
    console.warn(`[email.worker] Token de verificaci\xF3n no encontrado o vencido para userId=${userId}`);
    return;
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || "";
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendMail({
    to: email,
    subject: "Confirm\xE1 tu cuenta - Plataforma de Servicios Ceres",
    html: `
      <p>Hola ${firstName != null ? firstName : ""},</p>
      <p>Gracias por registrarte en la <strong>Plataforma de Servicios Ceres</strong>.</p>
      <p>Para activar tu cuenta, hac\xE9 clic en el siguiente enlace:</p>
      <p><a href="${verifyUrl}">Confirmar mi cuenta</a></p>
      <p>Este enlace vence en 24 horas.</p>
      <p>Si no fuiste vos, ignor\xE1 este correo.</p>
    `,
    text: `Hola ${firstName != null ? firstName : ""}, confirm\xE1 tu cuenta ingresando a: ${verifyUrl}`
  });
  console.log(`[email.worker] Email de verificaci\xF3n enviado a ${email}`);
}
async function sendWelcomeEmail(data) {
  const { email, firstName } = data;
  await sendMail({
    to: email,
    subject: "\xA1Bienvenido a Plataforma de Servicios Ceres!",
    html: `
      <p>Hola ${firstName != null ? firstName : ""},</p>
      <p>\xA1Tu cuenta ha sido verificada exitosamente!</p>
      <p>Ya pod\xE9s comenzar a usar todos los servicios de la plataforma.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ""}/dashboard">Ir a mi panel</a></p>
    `,
    text: `Hola ${firstName != null ? firstName : ""}, tu cuenta ha sido verificada. Visit\xE1: ${process.env.NEXT_PUBLIC_BASE_URL || ""}/dashboard`
  });
  console.log(`[email.worker] Email de bienvenida enviado a ${email}`);
}

// src/jobs/slack.worker.ts
async function postToSlack(data) {
  const text = typeof data === "string" ? data : data.text;
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn("[slack.worker] SLACK_WEBHOOK_URL no configurado");
    return;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      throw new Error(`Slack respondi\xF3 con status ${response.status}`);
    }
    console.log(`[slack.worker] Alerta enviada a Slack: ${text.substring(0, 50)}...`);
  } catch (error) {
    console.error("[slack.worker] Error enviando a Slack:", error);
  }
}

// src/jobs/maintenance.worker.ts
var import_bullmq = require("bullmq");

// src/jobs/slack.producer.ts
async function enqueueSlackAlert(_key, _text) {
  return null;
}

// src/jobs/maintenance.worker.ts
async function scheduleMaintenance(base2) {
  const q = new import_bullmq.Queue("maintenance", base2);
  await q.add("clean-verification-tokens", {}, {
    jobId: "maintenance:clean-verification-tokens",
    repeat: {
      pattern: "0 * * * *",
      // Cada hora
      tz: "America/Argentina/Cordoba"
    },
    removeOnComplete: true
  });
  await q.add("daily-report", {}, {
    jobId: "maintenance:daily-report",
    repeat: {
      pattern: "0 9 * * *",
      // 09:00 todos los días
      tz: "America/Argentina/Cordoba"
    },
    removeOnComplete: true
  });
  console.log("[maintenance.worker] Crons de mantenimiento programados");
}
function createMaintenanceWorker(base2) {
  return new import_bullmq.Worker("maintenance", async (job) => {
    if (job.name === "clean-verification-tokens") {
      await cleanExpiredVerificationTokens();
    } else if (job.name === "daily-report") {
      await generateDailyReport();
    }
  }, __spreadProps(__spreadValues({}, base2), { concurrency: 1 }));
}
async function cleanExpiredVerificationTokens() {
  const result = await prisma.verificationToken.deleteMany({
    where: {
      expiresAt: { lt: /* @__PURE__ */ new Date() }
    }
  });
  console.log(`[maintenance.worker] Limpiados ${result.count} tokens de verificaci\xF3n vencidos`);
  if (result.count > 100) {
    await enqueueSlackAlert(
      `maintenance:clean-tokens:${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
      `\u{1F9F9} Limpiados ${result.count} tokens de verificaci\xF3n vencidos`
    );
  }
}
async function generateDailyReport() {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const [totalUsers, newUsersToday, totalProfessionals] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.professional.count()
  ]);
  const report = `\u{1F4CA} Reporte Diario Ceres
Usuarios totales: ${totalUsers}
Nuevos hoy: ${newUsersToday}
Profesionales activos: ${totalProfessionals}`;
  await enqueueSlackAlert(
    `maintenance:daily-report:${today.toISOString().split("T")[0]}`,
    report
  );
  console.log("[maintenance.worker] Reporte diario generado");
}

// src/jobs/files.worker.ts
var import_sharp = __toESM(require("sharp"));
var import_path = require("path");
var import_fs = require("fs");
var import_fs2 = require("fs");
async function optimizeProfileImage(data) {
  const publicRoot = (0, import_path.join)(process.cwd(), "public");
  const absolute = (0, import_path.join)(publicRoot, data.path.replace(/^\/+/, ""));
  if (!(0, import_fs.existsSync)(absolute)) {
    console.warn("[files.worker] Imagen no existe:", absolute);
    return;
  }
  const dir = (0, import_path.dirname)(absolute);
  const name = (0, import_path.basename)(absolute, (0, import_path.extname)(absolute));
  const webpOut = (0, import_path.join)(dir, `${name}.webp`);
  if ((0, import_fs.existsSync)(webpOut)) return;
  const image = (0, import_sharp.default)(absolute).rotate();
  const meta = await image.metadata();
  const needsDownscale = (meta.width || 0) > 3e3;
  const pipeline = needsDownscale ? image.resize({ width: 2e3, withoutEnlargement: true, fit: "inside" }) : image;
  const isSmall = (meta.width || 0) > 0 && (meta.width || 0) < 700;
  await pipeline.webp({
    quality: isSmall ? 95 : 90,
    nearLossless: isSmall ? true : false,
    smartSubsample: true,
    effort: 5
  }).toFile(webpOut);
}
async function validateCV(data) {
  const publicRoot = (0, import_path.join)(process.cwd(), "public");
  const absolute = (0, import_path.join)(publicRoot, data.path.replace(/^\/+/, ""));
  if (!(0, import_fs.existsSync)(absolute)) {
    console.warn("[files.worker] CV no existe:", absolute);
    return;
  }
  const stat = await import_fs2.promises.stat(absolute);
  const tenMB = 10 * 1024 * 1024;
  if (stat.size > tenMB) {
    console.warn("[files.worker] CV demasiado grande (>10MB):", absolute);
  }
}

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// scripts/worker.ts
var base = redisConnection();
console.log("[worker] Inicializando workers...");
console.log("[worker] Redis:", process.env.REDIS_URL);
console.log("[worker] Prefix:", base.prefix);
var emailWorker = new import_bullmq2.Worker("email", async (job) => {
  console.log(`[email.worker] Processing job ${job.id} (${job.name})`);
  if (job.name === "verify") {
    await sendVerificationEmail(job.data);
  } else if (job.name === "welcome") {
    await sendWelcomeEmail(job.data);
  } else {
    console.warn(`[email.worker] Unknown job type: ${job.name}`);
  }
}, __spreadProps(__spreadValues({}, base), {
  concurrency: 5
  // Procesa hasta 5 emails simultáneos
}));
emailWorker.on("completed", (job) => {
  console.log(`[email.worker] \u2713 Job ${job.id} completado`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`[email.worker] \u2717 Job ${job == null ? void 0 : job.id} fall\xF3:`, err.message);
});
var slackWorker = new import_bullmq2.Worker("slack", async (job) => {
  console.log(`[slack.worker] Processing job ${job.id} (${job.name})`);
  if (job.name === "alert") {
    await postToSlack(job.data);
  } else {
    console.warn(`[slack.worker] Unknown job type: ${job.name}`);
  }
}, __spreadProps(__spreadValues({}, base), {
  concurrency: 10
  // Alta concurrencia para alertas
}));
slackWorker.on("completed", (job) => {
  console.log(`[slack.worker] \u2713 Job ${job.id} completado`);
});
slackWorker.on("failed", (job, err) => {
  console.error(`[slack.worker] \u2717 Job ${job == null ? void 0 : job.id} fall\xF3:`, err.message);
});
var filesWorker = new import_bullmq2.Worker("files", async (job) => {
  console.log(`[files.worker] Processing job ${job.id} (${job.name})`);
  if (job.name === "optimize-profile-image") {
    await optimizeProfileImage(job.data);
  } else if (job.name === "validate-cv") {
    await validateCV(job.data);
  } else {
    console.warn(`[files.worker] Unknown job type: ${job.name}`);
  }
}, __spreadProps(__spreadValues({}, base), { concurrency: 2 }));
filesWorker.on("completed", (job) => {
  console.log(`[files.worker] \u2713 Job ${job.id} completado`);
});
filesWorker.on("failed", (job, err) => {
  console.error(`[files.worker] \u2717 Job ${job == null ? void 0 : job.id} fall\xF3:`, err.message);
});
var emailEvents = new import_bullmq2.QueueEvents("email", base);
emailEvents.on("failed", async ({ jobId, failedReason }) => {
  const isDLQ = failedReason && failedReason.includes("exceeded");
  if (isDLQ) {
    console.error(`[DLQ] Email job ${jobId} agot\xF3 reintentos: ${failedReason}`);
    await postToSlack({
      text: `\u{1F525} DLQ Email: Job ${jobId} agot\xF3 reintentos
${failedReason}`
    });
  }
});
var slackEvents = new import_bullmq2.QueueEvents("slack", base);
slackEvents.on("failed", async ({ jobId, failedReason }) => {
  console.error(`[DLQ] Slack job ${jobId} fall\xF3:`, failedReason);
});
var filesEvents = new import_bullmq2.QueueEvents("files", base);
filesEvents.on("failed", async ({ jobId, failedReason }) => {
  console.error(`[DLQ] Files job ${jobId} fall\xF3:`, failedReason);
  await postToSlack({
    text: `\u{1F525} DLQ Files: Job ${jobId} agot\xF3 reintentos
${failedReason}`
  });
});
var maintenanceWorker = createMaintenanceWorker(base);
maintenanceWorker.on("completed", (job) => {
  console.log(`[maintenance.worker] \u2713 Job ${job.id} completado`);
});
maintenanceWorker.on("failed", (job, err) => {
  console.error(`[maintenance.worker] \u2717 Job ${job == null ? void 0 : job.id} fall\xF3:`, err.message);
});
scheduleMaintenance(base).then(() => console.log("[worker] \u2713 Crons de mantenimiento programados")).catch((err) => {
  console.error("[worker] Error programando crons:", err);
  process.exit(1);
});
var shutdown = async (signal) => {
  console.log(`
[worker] Recibido ${signal}, cerrando workers...`);
  await Promise.all([
    emailWorker.close(),
    slackWorker.close(),
    filesWorker.close(),
    maintenanceWorker.close(),
    emailEvents.close(),
    slackEvents.close(),
    filesEvents.close()
  ]);
  console.log("[worker] Workers cerrados exitosamente");
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
console.log("[worker] \u2713 Workers inicializados y escuchando jobs");
