// Uses native fetch (no deps). Node 18+ on Netlify has global fetch.
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") || Math.random().toString(36).slice(2);
    const redirect_uri = `${url.origin}/.netlify/functions/gh-oauth`;

    if (!code) {
      const auth = new URL("https://github.com/login/oauth/authorize");
      auth.searchParams.set("client_id", CLIENT_ID);
      auth.searchParams.set("redirect_uri", redirect_uri);
      auth.searchParams.set("scope", "repo,user");
      auth.searchParams.set("state", state);
      return { statusCode: 302, headers: { Location: auth.toString() } };
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri })
    });
    const data = await tokenRes.json();
    if (!data.access_token) return { statusCode: 400, body: "OAuth error" };

    const html = `<!doctype html><html><body><script>
      (function(){
        var msg = 'authorization:github:success:' + JSON.stringify({ token: '${data.access_token}' });
        if (window.opener && window.opener.postMessage) { window.opener.postMessage(msg, '*'); window.close(); }
        else { document.body.textContent = 'Authorized. You can close this window.'; }
      })();
    </script></body></html>`;
    return { statusCode: 200, headers: { "Content-Type": "text/html" }, body: html };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
