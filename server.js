
import http from "node:http";

const TARGET = "https://piromery2.piromery21.workers.dev";
const PORT = Number(process.env.PORT || 10000);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, TARGET);

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (
        value === undefined ||
        ["host", "connection", "content-length", "transfer-encoding"].includes(name)
      ) continue;
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }

    headers.delete("accept-encoding");
    
    headers.delete("authorization");
    headers.delete("origin");
    headers.delete("referer");

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : req,
      duplex: "half",
      redirect: "manual"
    });
const setCookie = response.headers.get("set-cookie");
    res.writeHead(response.status, {
      "content-type": response.headers.get("content-type") || "application/octet-stream",
      "cache-control": "no-store"
    });

    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("Proxy error:", error);
    res.writeHead(502, { "content-type": "text/plain" });
    res.end("Bad Gateway");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PIROMERY proxy running on port ${PORT}`);
});
