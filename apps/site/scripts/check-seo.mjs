import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteOrigin = "https://bot.sentrahai.com";
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assertContains(relativePath, snippet) {
  if (!read(relativePath).includes(snippet)) {
    fail(`${relativePath} missing ${JSON.stringify(snippet)}`);
  }
}

function assertNotLfsPointer(relativePath, minBytes) {
  const path = join(root, relativePath);
  const size = statSync(path).size;
  const head = readFileSync(path, { encoding: "utf8" }).slice(0, 80);
  if (head.startsWith("version https://git-lfs.github.com/spec/v1")) {
    fail(`${relativePath} is a Git LFS pointer`);
  }
  if (size < minBytes) {
    fail(`${relativePath} is ${size} bytes; expected at least ${minBytes}`);
  }
}

function pngSize(relativePath) {
  const buffer = readFileSync(join(root, relativePath));
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    fail(`${relativePath} is not a PNG`);
    return { width: 0, height: 0 };
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const pages = [
  {
    file: "index.html",
    canonical: `${siteOrigin}/`,
    title: "<title>Sentra Bot</title>",
    indexed: true,
  },
  {
    file: "public/tentang.html",
    canonical: `${siteOrigin}/tentang.html`,
    title: "<title>Mengenai Sentra Artificial Intelligence</title>",
    indexed: true,
  },
  {
    file: "public/daftar.html",
    canonical: `${siteOrigin}/daftar.html`,
    title: "<title>Cara memulai | Sentra Bot</title>",
    indexed: true,
  },
  {
    file: "public/privasi.html",
    canonical: `${siteOrigin}/privasi.html`,
    title: "<title>Kebijakan Privasi | Sentra Bot</title>",
    indexed: false,
  },
  {
    file: "public/ketentuan.html",
    canonical: `${siteOrigin}/ketentuan.html`,
    title: "<title>Ketentuan Layanan | Sentra Bot</title>",
    indexed: false,
  },
  {
    file: "public/404.html",
    canonical: `${siteOrigin}/404.html`,
    title: "<title>Halaman tidak ditemukan | Sentra Bot</title>",
    indexed: false,
  },
];

for (const page of pages) {
  const html = read(page.file);
  if (!html.includes(page.title)) {
    fail(`${page.file} missing ${page.title}`);
  }
  assertContains(page.file, `rel="canonical" href="${page.canonical}"`);
  assertContains(page.file, 'name="description"');
  assertContains(page.file, `property="og:url" content="${page.canonical}"`);
  assertContains(page.file, 'property="og:title"');
  assertContains(page.file, 'property="og:description"');
  assertContains(page.file, `property="og:image" content="${siteOrigin}/og-image.png"`);
  assertContains(page.file, 'name="twitter:card" content="summary_large_image"');
  assertContains(page.file, `name="twitter:image" content="${siteOrigin}/og-image.png"`);
  assertContains(page.file, 'href="/favicon.ico"');
  assertContains(page.file, 'href="/favicon.svg"');
  assertContains(page.file, 'href="/apple-touch-icon.png"');
  assertContains(page.file, 'src="/js/site-analytics.js"');
  if (page.indexed) {
    if (html.includes('name="robots" content="noindex')) {
      fail(`${page.file} should be indexable`);
    }
  } else if (!html.includes('name="robots" content="noindex')) {
    fail(`${page.file} should be noindex`);
  }
}

assertContains("public/privasi/index.html", `rel="canonical" href="${siteOrigin}/privasi.html"`);
assertContains("public/ketentuan/index.html", `rel="canonical" href="${siteOrigin}/ketentuan.html"`);

const sitemap = read("public/sitemap.xml");
for (const loc of [`${siteOrigin}/`, `${siteOrigin}/tentang.html`, `${siteOrigin}/daftar.html`]) {
  if (!sitemap.includes(`<loc>${loc}</loc>`)) {
    fail(`sitemap.xml missing ${loc}`);
  }
}
if (sitemap.includes("privasi.html") || sitemap.includes("ketentuan.html") || sitemap.includes("404.html")) {
  fail("sitemap.xml should not list noindex pages");
}

assertContains("public/robots.txt", `Sitemap: ${siteOrigin}/sitemap.xml`);
assertNotLfsPointer("public/favicon.ico", 1000);
assertNotLfsPointer("public/favicon.svg", 1000);
assertNotLfsPointer("public/og-image.png", 10_000);
assertNotLfsPointer("public/apple-touch-icon.png", 1000);

const og = pngSize("public/og-image.png");
if (og.width !== 1200 || og.height !== 630) {
  fail(`og-image.png is ${og.width}x${og.height}; expected 1200x630`);
}

const analytics = JSON.parse(read("public/analytics.json"));
for (const key of ["posthogKey", "posthogHost", "plausibleDomain", "ga4MeasurementId"]) {
  if (!(key in analytics)) {
    fail(`analytics.json missing ${key}`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => ` - ${error}`).join("\n"));
  process.exit(1);
}

console.log("site SEO checks passed");
