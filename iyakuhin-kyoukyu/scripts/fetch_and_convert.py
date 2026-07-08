#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""医薬品供給状況（限定出荷・供給停止）一覧の取得・JSON 変換スクリプト。

処理の流れ:
  1. 厚労省の一覧ページ HTML を取得し、最新の .xlsx への絶対 URL と掲載日を抽出する。
     （URL は日付入りで毎回変わるため、決してハードコードせず動的に取得する。）
  2. Excel をダウンロードして pandas + openpyxl で読み込む。
  3. ヘッダ位置・結合セルを吸収し、1 行 1 品目のレコードへ正規化する。
  4. docs/data.json として書き出す。

安全設計の要点:
  - 取得失敗・列構成の変化を検知したら、握りつぶさず例外で異常終了する。
    （サイレントに古いデータのまま「更新済み」と表示されるのを防ぐため。）
  - `--inspect` を付けて実行すると、変換は行わず、全シート名・先頭行・列構成を
    そのまま出力する（構造把握フェーズ用）。

使い方:
  python scripts/fetch_and_convert.py            # data.json を生成
  python scripts/fetch_and_convert.py --inspect  # Excel の構造をダンプするだけ
  python scripts/fetch_and_convert.py --xlsx path/to/local.xlsx  # ローカル Excel を使う
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# 定数
# ---------------------------------------------------------------------------

# 最新 Excel のリンクを掲載している一覧ページ。
LISTING_URL = (
    "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/"
    "kenkou_iryou/iryou/kouhatu-iyaku/04_00003.html"
)

# ブラウザを装った UA。素の requests だと弾かれるサイトがあるため。
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
    "iyakuhin-kyoukyu-bot/1.0"
)

# 出力先。スクリプトの位置を基準に docs/data.json を決定する。
REPO_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = REPO_DIR / "docs" / "data.json"

# 日本標準時。fetched_at と cron の基準に使う。
JST = _dt.timezone(_dt.timedelta(hours=9), name="JST")


class StructureError(RuntimeError):
    """Excel の構造が想定と変わり、列を特定できなかったときに送出する。"""


# ---------------------------------------------------------------------------
# 列名の検出キーワード
#   厚労省の Excel はヘッダ表記が年によって微妙に揺れる。決め打ちを避けるため、
#   「この語を含む列をこの項目とみなす」という部分一致ルールで検出する。
#   --inspect で実データの見出しを確認し、必要に応じてここを調整する。
# ---------------------------------------------------------------------------

COLUMN_KEYWORDS: dict[str, list[str]] = {
    "ingredient": ["成分名", "一般名", "一般的名称"],
    "brand": ["販売名", "品名", "製品名", "銘柄"],
    "maker": ["製造販売業者", "企業名", "会社名", "メーカー", "業者名"],
    "spec": ["規格", "剤形", "包装", "含量"],
    "supply_status": ["出荷対応", "出荷状況", "出荷区分", "出荷の状況", "供給状況"],
    "volume_status": ["出荷量", "供給量"],
    "resume_prospect": ["再開", "回復", "解消", "見込", "見通"],
    "is_new": ["更新", "new", "New", "ＮＥＷ"],
}

# 出荷対応（①〜⑤）の生テキスト → フィルタ用の区分コードへの対応。
# 生テキストには丸数字や括弧の揺れがあるため、キーワード部分一致で判定する。
SUPPLY_STATUS_RULES: list[tuple[str, str, list[str]]] = [
    # (status_code, 正規化ラベル, 部分一致キーワード)
    ("供給停止", "供給停止", ["供給停止", "⑤"]),
    ("限定出荷_他社影響", "限定出荷（他社品の影響）", ["他社", "③"]),
    ("限定出荷_自社事情", "限定出荷（自社の事情）", ["自社", "②"]),
    ("限定出荷_その他", "限定出荷（その他）", ["④"]),
    ("限定出荷", "限定出荷", ["限定出荷"]),
    ("通常出荷", "通常出荷", ["通常出荷", "①"]),
]


# ---------------------------------------------------------------------------
# 1. 一覧ページから最新 xlsx と掲載日を取得
# ---------------------------------------------------------------------------

def fetch_listing_html(url: str = LISTING_URL) -> str:
    """一覧ページの HTML 文字列を返す。"""
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    resp.raise_for_status()
    # 厚労省ページは基本 UTF-8 だが、念のため apparent_encoding も見る。
    resp.encoding = resp.apparent_encoding or resp.encoding
    return resp.text


def find_latest_xlsx(html: str, base_url: str = LISTING_URL) -> tuple[str, str | None]:
    """HTML から最新 .xlsx の絶対 URL と、その周辺テキストから読み取った掲載日を返す。

    戻り値: (xlsx_absolute_url, published_date | None)
    """
    soup = BeautifulSoup(html, "lxml")

    # .xlsx で終わるリンクを全て集める（クエリ付きも考慮して小文字化して判定）。
    candidates: list[tuple[str, str]] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if ".xlsx" in href.lower():
            text = a.get_text(" ", strip=True)
            candidates.append((href, text))

    if not candidates:
        raise StructureError(
            "一覧ページから .xlsx リンクを 1 つも検出できませんでした。"
            "ページ構造が変わった可能性があります。"
        )

    # 「供給」に関する Excel を優先。ファイル名やリンク文言に供給/kyoukyu を含むもの。
    def score(href_text: tuple[str, str]) -> tuple[int, str]:
        href, text = href_text
        blob = f"{href} {text}".lower()
        s = 0
        if "kyoukyu" in blob or "供給" in blob:
            s += 10
        if "iyakuhin" in blob or "医薬品" in blob:
            s += 3
        # ファイル名の日付（6 桁）が新しいものを優先するため、数字も加味。
        m = re.search(r"/(\d{6})[^/]*\.xlsx", href.lower())
        date_key = m.group(1) if m else "000000"
        return (s, date_key)

    href, text = max(candidates, key=score)
    xlsx_url = urljoin(base_url, href)

    # 掲載日（例: 令和8年5月29日現在 / 2026年5月29日）をページ全体から拾う。
    published = _extract_published_date(soup.get_text(" ", strip=True), href)
    return xlsx_url, published


def _extract_published_date(page_text: str, href: str) -> str | None:
    """本文テキストやファイル名から掲載日 (YYYY-MM-DD) を推定する。"""
    # 1) 令和 X年Y月Z日
    m = re.search(r"令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日", page_text)
    if m:
        reiwa, mo, da = int(m.group(1)), int(m.group(2)), int(m.group(3))
        year = 2018 + reiwa  # 令和元年 = 2019
        return f"{year:04d}-{mo:02d}-{da:02d}"
    # 2) 西暦 YYYY年M月D日
    m = re.search(r"(20\d{2})\s*年\s*(\d+)\s*月\s*(\d+)\s*日", page_text)
    if m:
        return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # 3) ファイル名先頭 6 桁を和暦 YYMMDD とみなす（例: 260529 → 令和8年5月29日）。
    m = re.search(r"/(\d{2})(\d{2})(\d{2})[^/]*\.xlsx", href.lower())
    if m:
        yy, mo, da = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return f"{2018 + yy:04d}-{mo:02d}-{da:02d}"
    return None


def download_xlsx(url: str, dest: Path) -> Path:
    """xlsx をダウンロードして dest に保存する。"""
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=120)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
    return dest


# ---------------------------------------------------------------------------
# 2. Excel の構造把握（--inspect 用）
# ---------------------------------------------------------------------------

def inspect_xlsx(xlsx_path: Path, n_rows: int = 20) -> None:
    """全シート名・各シートの先頭 n_rows 行・列数をそのまま標準出力へ。"""
    import pandas as pd  # 遅延 import（--inspect 時のみ必要なら軽く保つ）

    xls = pd.ExcelFile(xlsx_path, engine="openpyxl")
    print(f"# シート一覧（{len(xls.sheet_names)} 枚）: {xls.sheet_names}\n")
    for name in xls.sheet_names:
        # header=None で生のまま読む（ヘッダ位置を人の目で確認するため）。
        df = pd.read_excel(xls, sheet_name=name, header=None, nrows=n_rows)
        print(f"=== シート: {name} / 形状(先頭{n_rows}行): {df.shape} ===")
        with pd.option_context(
            "display.max_columns", None,
            "display.width", 200,
            "display.max_colwidth", 30,
        ):
            print(df.to_string())
        print()


# ---------------------------------------------------------------------------
# 3. 変換ロジック
# ---------------------------------------------------------------------------

def _norm(text: object) -> str:
    """セル値を検索・比較しやすい文字列へ正規化（NaN→空, 前後空白除去）。"""
    if text is None:
        return ""
    s = str(text)
    if s.strip().lower() in {"nan", "none"}:
        return ""
    return s.strip()


def detect_header_row(raw, max_scan: int = 15) -> int:
    """成分名・販売名らしき見出しを含む行番号を推定する。

    ヘッダが数行にまたがることがあるため、キーワード命中数が最大の行を採用する。
    """
    best_row, best_hits = 0, -1
    keywords = [kw for kws in COLUMN_KEYWORDS.values() for kw in kws]
    for i in range(min(max_scan, len(raw))):
        row_vals = [_norm(v) for v in raw.iloc[i].tolist()]
        blob = " ".join(row_vals)
        hits = sum(1 for kw in keywords if kw in blob)
        if hits > best_hits:
            best_row, best_hits = i, hits
    if best_hits < 2:
        raise StructureError(
            "ヘッダ行を特定できませんでした（成分名・販売名などの見出しが見つからない）。"
            "Excel の構造が変わった可能性があります。--inspect で確認してください。"
        )
    return best_row


def map_columns(header_values: list[str]) -> dict[str, int]:
    """ヘッダ文字列のリストから {項目キー: 列インデックス} を作る。"""
    mapping: dict[str, int] = {}
    for key, keywords in COLUMN_KEYWORDS.items():
        for idx, cell in enumerate(header_values):
            if any(kw in cell for kw in keywords):
                mapping.setdefault(key, idx)
                break
    # 必須列（成分名 or 販売名、出荷対応）が無ければ構造変化とみなす。
    if "ingredient" not in mapping and "brand" not in mapping:
        raise StructureError("成分名・販売名の列を特定できませんでした。")
    if "supply_status" not in mapping:
        raise StructureError("出荷対応（出荷状況）の列を特定できませんでした。")
    return mapping


def classify_supply_status(raw_text: str) -> tuple[str, str]:
    """出荷対応の生テキスト → (status_code, 正規化ラベル)。"""
    for code, label, keywords in SUPPLY_STATUS_RULES:
        if any(kw in raw_text for kw in keywords):
            return code, label
    return "不明", raw_text


def convert(xlsx_path: Path, source_url: str, published_date: str | None) -> dict:
    """Excel を data.json 相当の dict へ変換する。"""
    import pandas as pd

    xls = pd.ExcelFile(xlsx_path, engine="openpyxl")

    items: list[dict] = []
    for sheet in xls.sheet_names:
        raw = pd.read_excel(xls, sheet_name=sheet, header=None)
        if raw.empty:
            continue
        try:
            header_row = detect_header_row(raw)
            header_values = [_norm(v) for v in raw.iloc[header_row].tolist()]
            colmap = map_columns(header_values)
        except StructureError:
            # このシートは対象表ではない（説明シート等）とみなしてスキップ。
            continue

        # 結合セルの縦持ちを吸収するため、成分名などは前方値で補完する。
        body = raw.iloc[header_row + 1:].reset_index(drop=True)

        def cell(row, key: str) -> str:
            idx = colmap.get(key)
            if idx is None or idx >= len(row):
                return ""
            return _norm(row.iloc[idx])

        last_ingredient = ""
        for _, row in body.iterrows():
            supply_raw = cell(row, "supply_status")
            brand = cell(row, "brand")
            ingredient = cell(row, "ingredient") or last_ingredient
            if ingredient:
                last_ingredient = ingredient
            # 実データ行の判定: 出荷対応か販売名のどちらかが埋まっている行のみ採用。
            if not supply_raw and not brand:
                continue
            code, label = classify_supply_status(supply_raw)
            is_new_raw = cell(row, "is_new")
            items.append({
                "ingredient": ingredient,
                "brand": brand,
                "maker": cell(row, "maker"),
                "spec": cell(row, "spec"),
                "supply_status": label or supply_raw,
                "supply_status_code": code,
                "volume_status": cell(row, "volume_status"),
                "resume_prospect": cell(row, "resume_prospect"),
                "is_new": bool(re.search(r"new", is_new_raw, re.IGNORECASE)),
                "source_sheet": sheet,
            })

    if not items:
        raise StructureError(
            "1 件もレコードを抽出できませんでした。列マッピングまたはシート構成が"
            "変わった可能性があります。--inspect で構造を確認してください。"
        )

    return {
        "published_date": published_date,
        "source_url": source_url,
        "fetched_at": _dt.datetime.now(JST).isoformat(timespec="seconds"),
        "item_count": len(items),
        "items": items,
    }


# ---------------------------------------------------------------------------
# エントリポイント
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="医薬品供給状況 Excel → data.json 変換")
    parser.add_argument("--inspect", action="store_true",
                        help="変換せずに Excel の構造（シート名・先頭行・列）をダンプする")
    parser.add_argument("--xlsx", type=Path, default=None,
                        help="ローカルの xlsx を使う（指定時は一覧ページ取得をスキップ）")
    parser.add_argument("--out", type=Path, default=OUTPUT_PATH,
                        help=f"出力先 JSON（既定: {OUTPUT_PATH}）")
    args = parser.parse_args(argv)

    # --- Excel の入手（ローカル指定 or 一覧ページから動的取得） ---
    if args.xlsx:
        xlsx_path = args.xlsx
        source_url = str(args.xlsx)
        published_date = None
        print(f"[info] ローカル Excel を使用: {xlsx_path}", file=sys.stderr)
    else:
        print(f"[info] 一覧ページ取得: {LISTING_URL}", file=sys.stderr)
        html = fetch_listing_html()
        source_url, published_date = find_latest_xlsx(html)
        print(f"[info] 最新 xlsx: {source_url}", file=sys.stderr)
        print(f"[info] 掲載日: {published_date}", file=sys.stderr)
        # 公開ディレクトリ(docs/)を汚さないよう、一時ファイルにダウンロードする。
        tmp = Path(tempfile.gettempdir()) / "iyakuhin_latest.xlsx"
        xlsx_path = download_xlsx(source_url, tmp)
        print(f"[info] ダウンロード完了: {xlsx_path} "
              f"({xlsx_path.stat().st_size:,} bytes)", file=sys.stderr)

    # --- 構造把握モード ---
    if args.inspect:
        inspect_xlsx(xlsx_path)
        return 0

    # --- 変換して書き出し ---
    data = convert(xlsx_path, source_url, published_date)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"[info] 書き出し完了: {args.out}（{data['item_count']} 件）", file=sys.stderr)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except StructureError as exc:
        # 構造変化は「気付ける失敗」にする（サイレント上書きを防ぐ）。
        print(f"[FATAL] 構造エラー: {exc}", file=sys.stderr)
        raise SystemExit(2)
    except requests.RequestException as exc:
        print(f"[FATAL] 取得エラー: {exc}", file=sys.stderr)
        raise SystemExit(3)
