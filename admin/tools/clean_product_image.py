#!/usr/bin/env python3
"""
KYOTO 后台 · 商品图 cleaned 管线（免费本地版，不花 AI key 的钱）

作用：原图（手机拍的镜架照片）→ 去背 → 裁剪 → 居中 → 标准化白底 1200x1200 PNG
输出可直接在后台「商品编辑 → 图片 → cleaned → 上传 cleaned 图」入库，
入库后顾客端自动显示（顾客端只读 cleaned/marketing 图，原图永不暴露）。

安装（Mac 终端跑一次）：
    pip3 install rembg pillow
    # 首次运行会自动下载去背模型（约 170MB），耐心等一次

用法：
    python3 clean_product_image.py /path/to/photo.jpg
    python3 clean_product_image.py /path/to/photos_dir
    python3 clean_product_image.py /path/to/photo.jpg -o /path/to/out_dir

输出：<原文件名>_cleaned.png
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("缺少 pillow：先跑  pip3 install pillow")

try:
    from rembg import remove
except ImportError:
    sys.exit("缺少 rembg：先跑  pip3 install rembg")

SIZE = 1200          # 输出正方形边长
PAD_RATIO = 0.08     # 主体四周留白比例
BG = (255, 255, 255) # 白底（顾客端卡片底色一致）


def clean_one(src: Path, out_dir: Path) -> Path:
    img = Image.open(src).convert("RGBA")
    # 1. 去背
    no_bg = remove(img)
    # 2. 取有效像素包围盒
    bbox = no_bg.getbbox()
    if not bbox:
        raise ValueError(f"去背失败（全透明）：{src}")
    cropped = no_bg.crop(bbox)
    # 3. 加边距
    w, h = cropped.size
    pad = int(max(w, h) * PAD_RATIO)
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    canvas.paste(cropped, (pad, pad), cropped)
    # 4. 正方形白底居中 + 缩放到标准尺寸
    side = max(canvas.size)
    square = Image.new("RGB", (side, side), BG)
    square.paste(canvas, ((side - canvas.width) // 2, (side - canvas.height) // 2), canvas)
    out = square.resize((SIZE, SIZE), Image.LANCZOS)

    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / f"{src.stem}_cleaned.png"
    out.save(dest, "PNG")
    return dest


def main() -> None:
    ap = argparse.ArgumentParser(description="KYOTO 商品图去背标准化（免费本地版）")
    ap.add_argument("input", help="单张图片或文件夹")
    ap.add_argument("-o", "--out", default=None, help="输出目录（默认 input 同级的 cleaned/）")
    args = ap.parse_args()

    src = Path(args.input).expanduser()
    if not src.exists():
        sys.exit(f"找不到：{src}")

    files = [src] if src.is_file() else sorted(
        p for p in src.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".heic"}
    )
    if not files:
        sys.exit("没有可处理的图片")

    out_dir = Path(args.out).expanduser() if args.out else (src.parent if src.is_file() else src) / "cleaned"
    ok, fail = 0, 0
    for f in files:
        try:
            dest = clean_one(f, out_dir)
            print(f"✓ {f.name} → {dest.name}")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"✗ {f.name}：{e}")
            fail += 1
    print(f"\n完成：成功 {ok} 张，失败 {fail} 张。输出目录：{out_dir}")
    print("下一步：后台 → 商品编辑 → 图片 → cleaned 分区 → 上传 cleaned 图")


if __name__ == "__main__":
    main()
