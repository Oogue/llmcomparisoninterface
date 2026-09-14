/*
  nim-proxy.js — Minimal local CORS workaround for NVIDIA NIM.

  Why only NVIDIA needs this: NVIDIA's hosted integrate.api.nvidia.com API
  sends no Access-Control-Allow-Origin header on its chat completions
  endpoint (confirmed both by a preflight check and a real blocked browser
  call — see README). There's no officially supported way to enable it
  either: an NVIDIA staff reply on their own developer forum
  (https://forums.developer.nvidia.com/t/please-handle-cors-to-make-it-possible-to-make-calls-from-the-browser/310061)
  says only "we'll keep this use case in mind," and notes the hosted API
  "isn't intended to be used for production" browser calls. Groq, Mistral,
  Cohere, and Google's OpenAI-compat layer all send proper CORS headers
  already and call their APIs directly from the browser. The 2 NVIDIA-
  native cards route through this proxy for that reason; the 2 DeepSeek
  cards also route through it, but for an unrelated reason — the native
  DeepSeek account is balance-blocked, and NVIDIA NIM hosts the same
  builds for free (see the MODELS array comment in script.js).

  Run: node nim-proxy.js
  Then use index.html as usual. NVIDIA_API_KEY is read from config.js on
  every request (not cached at startup), so editing the key doesn't
  require restarting the proxy. The key never reaches the browser — the
  app still sends its own copy of the key as before (same request shape,
  unchanged), but this proxy ignores that and injects its own server-side
  copy, so nothing new is exposed client-side.

  Local-only: no auth, no HTTPS, no deployment config. Not meant to run
  anywhere but a developer's own machine.
*/

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = 8787;
const UPSTREAM_PATH = "/v1/chat/completions";
const CONFIG_PATH = path.join(__dirname, "config.js");

// NIM cold-start latency varies a lot by model — the 2 native NVIDIA cards
// and deepseek-v4-flash typically land in 6-10s. deepseek-v4-pro needs
// 60-120s and, empirically, this setting alone does NOT make it succeed:
// something between here and NVIDIA still cuts the connection around ~42s
// regardless of this value (a direct curl to NVIDIA succeeds and takes
// ~117s, but negotiates HTTP/2; Node's `https` module here only speaks
// HTTP/1.1, and NVIDIA's gateway may allow HTTP/1.1 connections a shorter
// leash). Kept at 120s anyway as the correct policy for the other 3
// NIM-routed cards, which have headroom under it (see the deepseek-v4-pro
// comment in script.js's MODELS array for the full story and what would
// justify revisiting this with an HTTP/2-based rewrite).
const UPSTREAM_TIMEOUT_MS = 120000;

function loadNvidiaKey() {
  let text;
  try {
    text = fs.readFileSync(CONFIG_PATH, "utf8");
  } catch (err) {
    console.error(`Could not read ${CONFIG_PATH}: ${err.message}`);
    return "";
  }
  const match = text.match(/NVIDIA_API_KEY:\s*"([^"]*)"/);
  const key = match ? match[1] : "";
  if (!key || key === "your-key-here") {
    console.error("NVIDIA_API_KEY is missing or a placeholder in config.js — requests will be forwarded, but NVIDIA will reject them.");
  }
  return key;
}

const server = http.createServer((req, res) => {
  // Different port than the app's static server = different origin, so
  // this response needs its own CORS headers for the browser to accept it.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== UPSTREAM_PATH) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Only POST ${UPSTREAM_PATH} is supported by this proxy` }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const apiKey = loadNvidiaKey();
    const bodyBuffer = Buffer.from(body, "utf8");

    const upstreamReq = https.request(
      `https://integrate.api.nvidia.com${UPSTREAM_PATH}`,
      {
        method: "POST",
        timeout: UPSTREAM_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": bodyBuffer.length,
          // Injected here, server-side — the browser never needs the real key.
          Authorization: `Bearer ${apiKey}`
        }
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode, { "Content-Type": "application/json" });
        upstreamRes.pipe(res);
      }
    );
    // The `timeout` option above only emits this event — it doesn't abort
    // the request on its own. Destroying with an Error routes here through
    // the "error" handler too, so there's one place that writes the 502.
    upstreamReq.on("timeout", () => {
      upstreamReq.destroy(new Error(`No response from NVIDIA after ${UPSTREAM_TIMEOUT_MS / 1000}s`));
    });
    upstreamReq.on("error", (err) => {
      if (res.headersSent) {
        res.end();
        return;
      }
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Proxy could not reach NVIDIA: ${err.message}` }));
    });
    upstreamReq.write(bodyBuffer);
    upstreamReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`NVIDIA NIM CORS proxy listening on http://localhost:${PORT} — forwarding to https://integrate.api.nvidia.com${UPSTREAM_PATH}`);
});
