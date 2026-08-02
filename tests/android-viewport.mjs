import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.CROWNE_BASE_URL || "http://127.0.0.1:4173";
const artifactsDir = "artifacts/android-viewport";
const viewport = { width: 412, height: 915 };

await mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 2.625,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36"
});

const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("requestfailed", (request) => {
  failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "unknown"}`);
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function layoutSnapshot(label) {
  const result = await page.evaluate(() => {
    const visibleButtons = [...document.querySelectorAll("button")]
      .filter((button) => {
        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          label: button.getAttribute("aria-label") || button.textContent.trim().replace(/\s+/g, " "),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      title: document.title,
      hasViewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
      hasManifest: Boolean(document.querySelector('link[rel="manifest"]')),
      maxTouchPoints: navigator.maxTouchPoints,
      visibleButtons
    };
  });

  assert(result.hasViewportMeta, `${label}: viewport meta tag is missing`);
  assert(result.hasManifest, `${label}: web app manifest link is missing`);
  assert(result.documentWidth <= result.viewportWidth + 1, `${label}: horizontal document overflow ${result.documentWidth}px > ${result.viewportWidth}px`);
  assert(result.bodyWidth <= result.viewportWidth + 1, `${label}: horizontal body overflow ${result.bodyWidth}px > ${result.viewportWidth}px`);

  const undersized = result.visibleButtons.filter((button) => button.width < 40 || button.height < 40);
  assert(
    undersized.length === 0,
    `${label}: touch targets below 40px: ${undersized.map((button) => `${button.label} (${button.width}x${button.height})`).join(", ")}`
  );

  return result;
}

const report = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  viewport,
  userAgent: await page.evaluate(() => navigator.userAgent),
  screens: {}
};

try {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30_000 });
  await page.locator("main.title-screen").waitFor({ state: "visible" });

  const heading = (await page.locator("main.title-screen h1").innerText()).replace(/\s+/g, " ").trim();
  assert(heading.includes("The Blackout") && heading.includes("Contract"), `Unexpected title heading: ${heading}`);

  report.screens.title = await layoutSnapshot("title screen");
  await page.screenshot({ path: `${artifactsDir}/title-412x915.png`, fullPage: false });

  const primary = page.locator('button[data-action="start-checkpoint"], button[data-action="resume"]').first();
  await primary.waitFor({ state: "visible" });
  await primary.click();
  await page.locator("main.game-screen").waitFor({ state: "visible" });
  await page.locator(".scene-hero img").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const image = document.querySelector(".scene-hero img");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  });

  report.screens.gameTop = await layoutSnapshot("game screen top");
  await page.screenshot({ path: `${artifactsDir}/game-top-412x915.png`, fullPage: false });

  await page.locator(".story-panel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  report.screens.gameStory = await layoutSnapshot("game story panel");
  await page.screenshot({ path: `${artifactsDir}/game-story-412x915.png`, fullPage: false });

  assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(" | ")}`);
  assert(failedRequests.length === 0, `Failed requests: ${failedRequests.join(" | ")}`);

  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error instanceof Error ? error.stack || error.message : String(error);
  await page.screenshot({ path: `${artifactsDir}/failure-412x915.png`, fullPage: true }).catch(() => {});
  throw error;
} finally {
  report.consoleErrors = consoleErrors;
  report.pageErrors = pageErrors;
  report.failedRequests = failedRequests;
  await writeFile(`${artifactsDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}

console.log("Android viewport verification passed at 412x915.");
