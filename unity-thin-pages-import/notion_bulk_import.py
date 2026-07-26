#!/usr/bin/env python3
"""
Revolution Idle Wiki / 索引DB へユニティ層の薄いページを一括投入する。

使い方:
    export NOTION_TOKEN='ntn_xxxxx'
    python notion_bulk_import.py --dry-run
    python notion_bulk_import.py
    python notion_bulk_import.py --retry-failed

依存: requests のみ
    pip install requests
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

# ---------------------------------------------------------------- 設定

DATABASE_ID = "19db58f4-9432-4dd6-95a9-8352d80a06c2"  # 索引DB
API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

HIERARCHY = "ユニティ"  # 全件このカテゴリ固定

ELEMENTS_FILE = Path("elements.json")
FAILED_FILE = Path("failed.json")
LOG_FILE = Path("imported.log")

SLEEP_SEC = 0.34  # Notion のレート制限は約3req/秒

# ---------------------------------------------------------------- 語彙 allow-list
# 未知の値を投げると Notion が勝手に選択肢を増やし、表記揺れがゴミとして残る。
# ここに無い値が来たら投入を中止する。

ALLOWED_種別 = {
    "リセット層", "通貨", "強化要素", "チャレンジ", "自動化", "概念", "総論",
}

ALLOWED_確定度 = {"確定", "未確定あり", "要検証"}

ALLOWED_強化対象 = {
    # 既存（エタニティ層まで）
    "共通指数", "マルチゲイン", "ラップ速度", "アセンションパワー",
    "ジェネレーター指数", "ジェネレーター倍率", "スターベース", "スターダスト指数",
    "プレステージ", "プロモーション", "IP獲得量", "EP獲得量", "∞獲得量",
    "Σ獲得量", "RP", "DP", "なし",
    # ユニティ層で追加
    "℧獲得量", "アストロダスト獲得量", "ゴールド獲得量", "星座経験値",
    "攻撃レベル", "鉱物生産量", "元素生産量", "タロット資源",
}

ALLOWED_参照する記録 = {
    # 既存
    "∞数", "Σ数", "最速インフィニティ時間", "最速エタニティ時間",
    "ICクリア時間", "ECクリア数", "インフィニティ時間", "IP保有量",
    "GP保有量", "なし",
    # ユニティ層で追加
    "℧数", "最速ユニティ時間", "攻撃レベル", "精錬ノード取得数",
}


# ---------------------------------------------------------------- ユーティリティ

def headers():
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        sys.exit("NOTION_TOKEN が未設定です。export NOTION_TOKEN='ntn_xxx' を先に実行してください。")
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def log(msg):
    print(msg, flush=True)


# ---------------------------------------------------------------- 検証

def validate(elements):
    """allow-list 検証。1件でも違反があれば全件中止する。"""
    errors = []
    seen = set()

    for i, el in enumerate(elements):
        name = el.get("要素名")
        if not name:
            errors.append(f"[{i}] 要素名が空です")
            continue

        if name in seen:
            errors.append(f"[{i}] 要素名が JSON 内で重複: {name}")
        seen.add(name)

        種別 = el.get("種別", "強化要素")
        if 種別 not in ALLOWED_種別:
            errors.append(f"[{name}] 未知の種別: {種別}")

        確定度 = el.get("確定度", "要検証")
        if 確定度 not in ALLOWED_確定度:
            errors.append(f"[{name}] 未知の確定度: {確定度}")

        for v in el.get("強化対象", []):
            if v not in ALLOWED_強化対象:
                errors.append(f"[{name}] 未知の強化対象: {v}")

        for v in el.get("参照する記録", []):
            if v not in ALLOWED_参照する記録:
                errors.append(f"[{name}] 未知の参照する記録: {v}")

    if errors:
        log("=== 検証エラー。投入を中止します ===")
        for e in errors:
            log("  " + e)
        sys.exit(1)

    log(f"検証OK: {len(elements)} 件")


# ---------------------------------------------------------------- 既存ページ取得

def fetch_existing_names():
    """索引DBの既存 要素名 を全件取得。再実行時の二重登録を防ぐ。"""
    names = set()
    payload = {"page_size": 100}
    url = f"{API}/databases/{DATABASE_ID}/query"

    while True:
        r = requests.post(url, headers=headers(), json=payload, timeout=30)
        if r.status_code != 200:
            sys.exit(f"既存ページの取得に失敗しました: {r.status_code} {r.text}")

        data = r.json()
        for page in data.get("results", []):
            title = page.get("properties", {}).get("要素名", {}).get("title", [])
            if title:
                names.add(title[0].get("plain_text", ""))

        if not data.get("has_more"):
            break
        payload["start_cursor"] = data["next_cursor"]
        time.sleep(SLEEP_SEC)

    log(f"既存ページ: {len(names)} 件")
    return names


# ---------------------------------------------------------------- ペイロード構築

def build_properties(el):
    props = {
        "要素名": {"title": [{"text": {"content": el["要素名"]}}]},
        "階層": {"select": {"name": HIERARCHY}},
        "種別": {"select": {"name": el.get("種別", "強化要素")}},
        "確定度": {"select": {"name": el.get("確定度", "要検証")}},
    }

    解放条件 = el.get("解放条件", "")
    if 解放条件:
        props["解放条件"] = {"rich_text": [{"text": {"content": 解放条件}}]}

    備考 = el.get("備考", "スケルトン。詳細未記載。")
    if 備考:
        props["備考"] = {"rich_text": [{"text": {"content": 備考}}]}

    強化対象 = el.get("強化対象", [])
    if 強化対象:
        props["強化対象"] = {"multi_select": [{"name": v} for v in 強化対象]}

    参照 = el.get("参照する記録", [])
    if 参照:
        props["参照する記録"] = {"multi_select": [{"name": v} for v in 参照]}

    return props


def h2(text):
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def para(text):
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": [{"type": "text", "text": {"content": text}}]},
    }


def build_children(el):
    定義 = el.get("定義", "〔未記載〕")
    解放条件 = el.get("解放条件", "〔未記載〕") or "〔未記載〕"
    return [
        h2("定義"),
        para(定義),
        h2("解放条件"),
        para(解放条件),
        h2("詳細"),
        para("〔未記載〕必要時に追記する。"),
    ]


# ---------------------------------------------------------------- 投入

def create_page(el):
    payload = {
        "parent": {"database_id": DATABASE_ID},
        "properties": build_properties(el),
        "children": build_children(el),
    }
    r = requests.post(f"{API}/pages", headers=headers(), json=payload, timeout=30)
    if r.status_code != 200:
        return None, f"{r.status_code} {r.text[:300]}"
    return r.json().get("id"), None


def run(elements, dry_run):
    validate(elements)

    if dry_run:
        log("\n=== DRY RUN（送信しません） ===")
        for el in elements:
            log(f"\n--- {el['要素名']}")
            log(json.dumps(build_properties(el), ensure_ascii=False, indent=2))
        log(f"\n合計 {len(elements)} 件を投入予定です。")
        return

    existing = fetch_existing_names()
    failed = []
    created = 0
    skipped = 0

    with LOG_FILE.open("a", encoding="utf-8") as logf:
        for el in elements:
            name = el["要素名"]

            if name in existing:
                log(f"スキップ（既存）: {name}")
                skipped += 1
                continue

            page_id, err = create_page(el)
            if err:
                log(f"失敗: {name} -> {err}")
                failed.append(el)
            else:
                log(f"作成: {name} -> {page_id}")
                logf.write(f"{datetime.now().isoformat()}\t{name}\t{page_id}\n")
                created += 1

            time.sleep(SLEEP_SEC)

    log(f"\n作成 {created} / スキップ {skipped} / 失敗 {len(failed)}")

    if failed:
        FAILED_FILE.write_text(
            json.dumps(failed, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        log(f"失敗分を {FAILED_FILE} に書き出しました。--retry-failed で再投入できます。")


# ---------------------------------------------------------------- エントリポイント

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="送信せず内容を表示")
    ap.add_argument("--retry-failed", action="store_true", help="failed.json のみ再投入")
    ap.add_argument("--file", default=None, help="入力JSON（既定 elements.json）")
    args = ap.parse_args()

    if args.retry_failed:
        src = FAILED_FILE
    elif args.file:
        src = Path(args.file)
    else:
        src = ELEMENTS_FILE

    if not src.exists():
        sys.exit(f"{src} が見つかりません。")

    elements = json.loads(src.read_text(encoding="utf-8"))
    if not isinstance(elements, list):
        sys.exit("入力JSONは配列である必要があります。")

    log(f"入力: {src}（{len(elements)} 件）")
    run(elements, args.dry_run)


if __name__ == "__main__":
    main()
