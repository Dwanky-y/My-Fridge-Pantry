import { createApiHandler } from "../../server/api.js";

// Adapt the shared API to Netlify's Request/Response interface.
export function createNetlifyHandler(api = createApiHandler()) {
  return async function handler(request) {
    const url = new URL(request.url);
    const functionPath = "/.netlify/functions/recipes";
    if (
      url.pathname === functionPath ||
      url.pathname.startsWith(functionPath + "/")
    ) {
      url.pathname = "/api/recipes" + url.pathname.slice(functionPath.length);
    }
    let status = 200,
      headers = {},
      body = "";
    await api(
      { method: request.method, url: url.pathname + url.search },
      {
        writeHead(code, responseHeaders) {
          status = code;
          headers = responseHeaders;
        },
        end(value) {
          body = value || "";
        },
      },
      () => {
        status = 404;
        headers = {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        };
        body = JSON.stringify({ error: "Unknown recipe endpoint." });
      },
    );
    return new Response(body, { status, headers });
  };
}

export default createNetlifyHandler();
