// ==============================================
// NO-JS RENDER TESTS
// The api/render handler exercised as a real Request
// against a stubbed shell, asserting on the returned
// bytes—the one path a browser check cannot prove.
// ==============================================
import { afterEach, describe, expect, it, vi } from "vitest"
import { GET } from "../../api/render.js"

const SHELL = `<!doctype html>
<html>
<head>
<link rel="canonical" href="https://www.depths.studio/" />
<meta property="og:url" content="https://www.depths.studio/" />
<meta name="robots" content="index, follow" />
</head>
<body>
<div id="root"></div>
</body>
</html>`

function stubShell(html: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(html, { status, headers: { "content-type": "text/html" } })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const req = (path: string) =>
  new Request(`https://www.depths.studio${path}`, {
    headers: {
      "x-forwarded-host": "www.depths.studio",
      "x-forwarded-proto": "https",
    },
  })

describe("GET /api/render", () => {
  it("injects both shapes—JSON script and visible pre—outside #root", async () => {
    stubShell(SHELL)
    const html = await (await GET(req("/?p=crisp"))).text()
    expect(html).toContain('<div id="agent-shadows">')
    expect(html).toContain('<script type="application/json" id="depths-scale">')
    expect(html).toContain("DEPTHS—www.depths.studio")
    // The block lands after the app root, before </body>.
    expect(html.indexOf("agent-shadows")).toBeGreaterThan(html.indexOf('<div id="root">'))
    // No hiding styles—the one style allowed is wrapping.
    expect(html).not.toContain("display:none")
  })

  it("rewrites the head only for parameterized URLs", async () => {
    stubShell(SHELL)
    const specific = await (await GET(req("/?p=crisp"))).text()
    expect(specific).toContain('content="noindex, follow"')
    expect(specific).toContain('href="https://www.depths.studio/?p=crisp"')

    stubShell(SHELL)
    const bare = await (await GET(req("/"))).text()
    expect(bare).toContain('content="index, follow"')
    expect(bare).toContain('href="https://www.depths.studio/"')
  })

  it("escapes hostile input out of the script element", async () => {
    stubShell(SHELL)
    const html = await (
      await GET(req("/?p=%3C%2Fscript%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E"))
    ).text()
    // The payload quotes the rejected preset back—it must arrive escaped.
    expect(html).not.toContain("</script><script>alert(1)")
  })

  it("refuses to inject into a page that is not our shell", async () => {
    stubShell("<html><body>SSO login</body></html>")
    const html = await (await GET(req("/?p=crisp"))).text()
    expect(html).not.toContain("agent-shadows")
    expect(html).toContain("SSO login")
  })

  it("502s when the shell cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down")
      }),
    )
    const res = await GET(req("/"))
    expect(res.status).toBe(502)
  })

  it("bounds the HTML cache while api/shadows stays immutable", async () => {
    stubShell(SHELL)
    const res = await GET(req("/?p=crisp"))
    expect(res.headers.get("cache-control")).toContain("s-maxage=60")
  })
})
