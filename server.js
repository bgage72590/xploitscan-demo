// Intentionally-vulnerable demo app. Do not use any of this code in real life.
// This exists only so the XploitScan GitHub Action has something to flag in CI.

const express = require("express");
const crypto = require("crypto");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const db = new sqlite3.Database(":memory:");

// --- HARDCODED SECRETS (critical) ---------------------------------
// Example values only — AKIAIOSFODNN7EXAMPLE is AWS's own documented
// fake key. Still a real vulnerability pattern a scanner should catch.
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const STRIPE_SECRET_KEY = "sk_test_4eC39HqLyjWDarjtT1zdp7dcDEMO";

// --- WEAK CRYPTO (high) -------------------------------------------
// MD5 for password hashing is broken beyond repair. Password hashes
// should use bcrypt / scrypt / argon2.
function hashPassword(password) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// Math.random() is not cryptographically secure. Tokens built this
// way are predictable.
function generateSessionToken() {
  return Math.random().toString(36).slice(2);
}

// --- SQL INJECTION (critical) -------------------------------------
// Never concatenate user input into SQL. Use parameterized queries.
app.get("/users/search", (req, res) => {
  const name = req.query.name;
  const query = "SELECT * FROM users WHERE name = '" + name + "'";
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- RCE via eval (critical) --------------------------------------
// Never eval() untrusted input.
app.post("/calc", (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});

// --- XSS via innerHTML (high) -------------------------------------
// Reflecting unsanitized user input into HTML opens XSS.
app.get("/greeting", (req, res) => {
  const name = req.query.name;
  res.send(`<html><body><h1>Hello ${name}!</h1></body></html>`);
});

// --- SSRF (high) --------------------------------------------------
// User-supplied URLs fetched server-side let attackers probe internal
// networks or metadata endpoints.
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  const response = await fetch(target);
  const body = await response.text();
  res.send(body);
});

// --- Insecure deserialization / prototype pollution (medium) ------
// Recursive Object.assign from user JSON is a classic prototype
// pollution sink.
app.post("/merge", (req, res) => {
  const target = {};
  function merge(dst, src) {
    for (const k in src) {
      if (typeof src[k] === "object" && src[k] !== null) {
        dst[k] = dst[k] || {};
        merge(dst[k], src[k]);
      } else {
        dst[k] = src[k];
      }
    }
  }
  merge(target, req.body);
  res.json(target);
});

// --- NEW ENDPOINT: user registration ------------------------------
// Introduced in this PR. Two problems XploitScan should flag:
//   1. SQL injection — still concatenating user input into SQL
//   2. MD5 password hash — see hashPassword() above
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashed = hashPassword(password);
  const query =
    "INSERT INTO users (email, password) VALUES ('" +
    email +
    "', '" +
    hashed +
    "')";
  db.run(query, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ token: generateSessionToken() });
  });
});

app.listen(3000, () => {
  console.log("Demo app listening on :3000 — do not expose this anywhere real.");
});

module.exports = { hashPassword, generateSessionToken };
