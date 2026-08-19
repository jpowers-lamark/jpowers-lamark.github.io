"""Optional browser smoke test.

Requirements:
  pip install playwright
  playwright install chromium

The test inlines the local modules, so it can run without a web server or Supabase.
"""

import asyncio
import re
import shutil
import tempfile
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


def build_bundle() -> tuple[str, str, str]:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    index = re.sub(r'<link rel="stylesheet"[^>]+>', "", index)
    index = re.sub(r'<script src="\.\/assets\/config\.js"></script>', "", index)
    index = re.sub(r'<script type="module" src="\.\/assets\/app\.js"></script>', "", index)

    css = (ROOT / "assets/styles.css").read_text(encoding="utf-8")
    data = (ROOT / "assets/data.js").read_text(encoding="utf-8")
    data = re.sub(r"^export const ", "const ", data, flags=re.M)
    keys = [
        "STAGES", "JOURNEY_STAGES", "PLATFORMS", "SIGNALS", "CLIENTS",
        "SHOCKS", "OBJECTIONS", "HUMAN_SIGNALS", "SAMPLE_JOURNEYS",
        "SEED_AUDIT_ROWS", "SOURCES",
    ]
    data_bundle = "(function(){\n" + data + "\nwindow.__SE_DATA={" + ",".join(keys) + "};\n})();"

    realtime = (ROOT / "assets/realtime.js").read_text(encoding="utf-8")
    realtime = realtime.replace(
        "export const realtime = new WorkshopRealtime();\nexport { createCode, normalizeCode, randomId };",
        "const realtime = new WorkshopRealtime();\nreturn { realtime, createCode, normalizeCode, randomId };",
    )
    realtime_bundle = "window.__SE_RT=(function(){\n" + realtime + "\n})();"

    app = (ROOT / "assets/app.js").read_text(encoding="utf-8")
    app = re.sub(r"import \{[\s\S]*?\} from './data\.js';\n", "", app, count=1)
    app = re.sub(r"import \{ realtime, randomId, normalizeCode \} from './realtime\.js';\n", "", app, count=1)
    app = (
        "const {STAGES,JOURNEY_STAGES,PLATFORMS,SIGNALS,CLIENTS,SHOCKS,OBJECTIONS,"
        "HUMAN_SIGNALS,SAMPLE_JOURNEYS,SEED_AUDIT_ROWS,SOURCES}=window.__SE_DATA;\n"
        "const {realtime,randomId,normalizeCode}=window.__SE_RT;\n" + app
    )

    bundle = (
        "window.SE_CONFIG={supabaseUrl:'',supabaseAnonKey:'',enableDemoFallback:true};\n"
        + data_bundle + "\n" + realtime_bundle + "\n" + app
    )
    return index, css, bundle


async def main() -> None:
    index, css, bundle = build_bundle()
    errors: list[str] = []
    executable = (
        shutil.which("chromium")
        or shutil.which("chromium-browser")
        or shutil.which("google-chrome")
    )

    async with async_playwright() as playwright:
        launch_options = {
            "headless": True,
            "args": ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        }
        if executable:
            launch_options["executable_path"] = executable
        browser = await playwright.chromium.launch(**launch_options)
        page = await browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("console", lambda msg: errors.append(f"console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))

        await page.set_content(index, wait_until="domcontentloaded")
        await page.add_style_tag(content=css)
        await page.evaluate(
            """() => {
              const make = () => {
                const map = new Map();
                return {
                  getItem: key => map.has(key) ? map.get(key) : null,
                  setItem: (key, value) => map.set(key, String(value)),
                  removeItem: key => map.delete(key),
                  clear: () => map.clear(),
                  key: index => [...map.keys()][index] || null,
                  get length() { return map.size; }
                };
              };
              Object.defineProperty(window, 'localStorage', { value: make(), configurable: true });
              Object.defineProperty(window, 'sessionStorage', { value: make(), configurable: true });
            }"""
        )
        await page.add_script_tag(content=bundle)
        await page.wait_for_timeout(500)

        if await page.locator("#join-dialog[open]").count():
            await page.locator("#join-cancel").click()

        assert await page.locator(".stage-button").count() == 14
        assert await page.locator("#scene-root").get_attribute("data-stage") == "welcome"

        for index in range(14):
            await page.locator(f'[data-stage-index="{index}"]').click()
            await page.wait_for_timeout(60)
            assert await page.locator("#scene-root h1, #scene-root h2").count() > 0

        await page.locator('[data-stage-index="6"]').click()
        await page.wait_for_timeout(80)
        assert await page.locator(".audit-table tbody tr").count() == 55
        await page.locator('[data-audit-filter="client"]').select_option("breezy")
        await page.wait_for_timeout(80)
        assert await page.locator(".audit-table tbody tr").count() == 24

        await page.locator('[data-stage-index="1"]').click()
        await page.locator('[data-action="fracture-choice"]').first.click()
        await page.wait_for_timeout(80)
        assert await page.locator(".poll-option.is-selected").count() == 1

        await page.locator('[data-stage-index="7"]').click()
        await page.locator('[data-action="board-add"]').first.click()
        await page.fill("#card-editor-headline", "Smoke-test evidence")
        await page.fill("#card-editor-detail", "Validates the shared evidence workflow.")
        await page.locator("#card-editor-form").evaluate("form => form.requestSubmit()")
        await page.wait_for_timeout(500)
        board_count = await page.locator(".board-card").count()
        if board_count < 1:
            print("board smoke debug", {"stage": await page.locator("#scene-root").get_attribute("data-stage"), "dialog": await page.locator("#card-editor-dialog[open]").count(), "errors": errors})
        assert board_count >= 1

        await page.locator('[data-stage-index="11"]').click()
        await page.locator('[data-action="strategy-add"]').click()
        await page.fill("#strategy-name", "Smoke-test initiative")
        await page.fill("#strategy-rationale", "Validates the weighted strategy workflow.")
        await page.fill("#strategy-action", "Run the first action.")
        await page.locator("#strategy-form").evaluate("form => form.requestSubmit()")
        await page.locator(".strategy-card").first.wait_for(state="visible", timeout=3000)
        assert await page.locator(".strategy-card").count() >= 1

        with tempfile.TemporaryDirectory() as temp_dir:
            await page.screenshot(path=str(Path(temp_dir) / "search-everywhere-smoke.png"), full_page=True)

        await browser.close()

    if errors:
        raise RuntimeError("Browser errors:\n" + "\n".join(errors))
    print("Browser smoke test passed: 14 stages, 55 audit rows, filters, poll, whiteboard, and strategy workflow.")


if __name__ == "__main__":
    asyncio.run(main())
