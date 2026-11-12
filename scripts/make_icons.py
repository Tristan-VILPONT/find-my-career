#!/usr/bin/env python3
"""Rasterise public/favicon.svg into the PWA PNGs.

Uses puppeteer-core and the system Chrome when they are available.
The committed PNGs are the source used by the site.
"""

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")
CHROME = shutil.which("google-chrome") or shutil.which("chromium")


def main() -> None:
    if not NODE or not CHROME:
        print("Icônes déjà dans public/icons (Chrome ou Node absent, rien à régénérer).")
        return
    script = r"""
import { readFileSync } from "node:fs"
import puppeteer from "puppeteer-core"
const svg = readFileSync("public/favicon.svg", "utf8")
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
})
const page = await browser.newPage()
async function shot(size, maskable, dest) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
  const inner = maskable ? Math.round(size * 0.72) : size
  const scaled = svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)
  const body = maskable
    ? `<body style="margin:0;width:${size}px;height:${size}px;background:#9a3412;display:flex;align-items:center;justify-content:center"><div style="width:${inner}px;height:${inner}px">${scaled}</div></body>`
    : `<body style="margin:0">${scaled}</body>`
  await page.setContent(`<!doctype html><meta charset="utf-8">${body}`)
  await page.screenshot({ path: dest, omitBackground: !maskable })
}
await shot(192, false, "public/icons/icon-192.png")
await shot(512, false, "public/icons/icon-512.png")
await shot(512, true, "public/icons/icon-maskable-512.png")
await shot(180, false, "public/icons/apple-touch-icon.png")
await browser.close()
"""
    try:
        subprocess.run(
            [NODE, "--input-type=module", "-e", script],
            cwd=ROOT,
            env={**dict(**{k: v for k, v in __import__("os").environ.items()}), "CHROME": CHROME},
            check=True,
            timeout=40,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        print("Régénération ignorée :", error, file=sys.stderr)
        sys.exit(0)
    print("icônes mises à jour")


if __name__ == "__main__":
    main()
