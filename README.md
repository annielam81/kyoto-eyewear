# KYOTO EYEWEAR — uni-app (iOS / Android / H5)

Vue 3 + TypeScript + Pinia + vue-i18n (EN / 中文 / ES). Mock backend — fully demoable offline.

## Prerequisites
| Tool | Windows | macOS | Purpose |
|---|---|---|---|
| Node.js ≥ 18 + npm | ✅ | ✅ | all builds |
| **HBuilderX** (App 开发版) | ✅ | ✅ | native run/package (Android + iOS) |
| Xcode 15+ | ❌ | ✅ **required** | iOS device install & signing |
| Apple ID (free ok for device test) | — | ✅ | iOS personal signing |
| Android phone + USB debugging | ✅ | ✅ | Android device test |

## Install & H5
```bash
npm install
npm run dev:h5        # http://localhost:5173
npm run build:h5      # dist/build/h5
npm run type-check
npm run test:domain
```

## Native app resource build (both OS)
```bash
npm run build:app     # → dist/build/app  (uni-app app resource bundle)
```

## Android on Windows (or macOS)
1. Open HBuilderX → File → Import → directory `dist/build/app` (or open project root and let HBuilderX use it).
2. Phone: enable Developer Mode + USB debugging, plug in.
3. HBuilderX: 运行 → 运行到手机或模拟器 → Android → your device.
   - First run uses the HBuilderX **standard debug base** (no keystore needed).
4. Installable APK (device-test, not Play release): 发行 → 原生App-云打包 → Android → 使用云端证书(测试) → 打包 → download APK → install.
   - No local Android SDK required for cloud pack. Do NOT use release channels yet.

## iOS on macOS ONLY
Windows **cannot** sign or side-load iOS builds — this step must run on the MacBook.
1. `git clone` the repo on macOS → `npm install` → `npm run build:app`.
2. HBuilderX (macOS): 运行 → 运行到手机或模拟器 → iOS → real device.
   - Requires Xcode installed + your Apple ID added in Xcode (free personal team OK).
   - First launch on device: Settings → General → VPN & Device Management → trust the developer profile.
3. Cloud-package IPA needs paid Apple Developer certs — **out of scope until App Store phase**.

## Switching computers (Windows ⇄ MacBook)
```bash
# machine A
git add -A && git commit -m "wip" && git push origin app-first
# machine B
git pull origin app-first && npm install
```
`node_modules` and `dist` are never committed; `package-lock.json` guarantees identical deps.

## App identity (placeholders — final IDs pending approval)
- Name: **KYOTO** (中文显示名 **京都** — set in HBuilderX packaging dialog / native locale config)
- Bundle/package: `com.kyoto.eyewear.dev` (dev placeholder, NOT a registered Apple/Google ID)
- Version 0.4.0 (code 040); icons/splash in `src/static/app/` are **placeholders** —
  final assets must be exported from the locked KYOTO wordmark SVG.

## What stays mocked
Auth · Payment (Apple Pay/card/FSA UI only) · Tax · Shipping · Upload backend ·
Try-On (UI shell, no AR) · Orders (local). See `docs/backend-architecture.md`.
