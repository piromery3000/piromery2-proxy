
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
      ) {
        continue;
      }

      headers.set(
        name,
        Array.isArray(value) ? value.join(", ") : value
      );
    }

    // Allow cookies to reach Cloudflare Worker.
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

    // Forward response headers, including session cookies.
    const responseHeaders = {};

    for (const [name, value] of response.headers.entries()) {
      if (
        [
          "connection",
          "transfer-encoding",
          "content-length",
          "content-encoding",
          "set-cookie"
        ].includes(name.toLowerCase())
      ) {
        continue;
      }

      responseHeaders[name] = value;
    }

    const cookies = response.headers.getSetCookie();

    if (cookies.length > 0) {
      responseHeaders["set-cookie"] = cookies;
    }

    responseHeaders["cache-control"] = "no-store";

    res.writeHead(response.status, responseHeaders);

    const body = Buffer.from(await response.arrayBuffer());
    res.end(body);

  } catch (error) {
    console.error("Proxy error:", error);

    res.writeHead(502, {
      "content-type": "text/plain; charset=utf-8"
    });

    res.end("Bad Gateway");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PIROMERY proxy running on port ${PORT}`);
});
