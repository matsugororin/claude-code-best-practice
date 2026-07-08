# 医薬品 出荷調整・供給状況 検索ツール

厚生労働省が公開している「医療用医薬品供給状況」（限定出荷・供給停止などの一覧）Excel を
自動取得し、ブラウザで素早く検索できる静的サイトです。調剤薬局の現場で
「この薬、今どういう出荷状況？」を即座に調べる用途を想定しています。

> このツールは `claude-code-best-practice` リポジトリ内の独立したサブプロジェクトです
> （`iyakuhin-kyoukyu/` 配下）。リポジトリ本体の best-practice ドキュメント群とは別物です。

## 公開 URL

GitHub Pages で公開されます（GitHub Actions によるデプロイ）。

- 公開 URL: `https://<ユーザー名>.github.io/<リポジトリ名>/`
  - 例: `https://matsugororin.github.io/claude-code-best-practice/`

初回公開の前に、リポジトリの **Settings → Pages → Build and deployment → Source** を
**「GitHub Actions」** に設定してください（サブフォルダの `docs/` を公開するため、
クラシックな「ブランチ /docs」方式ではなく Actions 経由でデプロイします）。

## 仕組み

```
一覧ページ(HTML) ──パース──▶ 最新 .xlsx の URL＋掲載日
        │
        ▼
   Excel ダウンロード ──pandas/openpyxl──▶ 1行1品目に正規化 ──▶ docs/data.json
                                                                     │
                                                            docs/index.html が
                                                            起動時に fetch して表示
```

- **`scripts/fetch_and_convert.py`**
  一覧ページの HTML を解析して最新 `.xlsx` の絶対 URL と掲載日を動的に取得し
  （URL はハードコードしない）、Excel を 1 行 1 品目の JSON へ変換して
  `docs/data.json` に書き出します。取得失敗・列構成の変化は握りつぶさず
  **異常終了**します（古いデータのまま黙って更新済み表示になるのを防ぐため）。
- **`docs/index.html`**
  外部ライブラリ非依存の単一 HTML。`data.json` を読み込み、フリーワード検索
  （成分名・販売名・メーカー横断／ひらがな・カタカナ・全半角の揺れを吸収）、
  出荷対応での絞り込み、「New のみ」表示、成分名グルーピング、
  **データ掲載日・取得日時の常時大表示**を行います。
- **`.github/workflows/update-iyakuhin.yml`**
  毎日 1 回データを更新し、成功時のみ Pages へ公開します。

## 更新頻度

- 毎日 **日本時間 05:00**（cron は UTC `0 20 * * *`）に自動実行。
- リポジトリの **Actions** タブから手動実行（Run workflow）も可能。
- `docs/data.json` に差分があるときだけコミットし、Pages を再デプロイします。
- 取得元の構造変化などでスクリプトが失敗した場合、ワークフローは**失敗**し、
  公開ジョブは実行されません（古いまま黙って上書きしない設計）。

## ローカルでの実行・確認

```bash
cd iyakuhin-kyoukyu
pip install -r requirements.txt

# 1) Excel の構造を確認（シート名・先頭行・列構成をダンプ）
python scripts/fetch_and_convert.py --inspect

# 2) data.json を生成
python scripts/fetch_and_convert.py

# 3) 画面を確認（file:// では fetch がブロックされるため簡易サーバ経由で）
python -m http.server -d docs 8000
#   → ブラウザで http://localhost:8000/ を開く
```

手元に Excel がある場合は `--xlsx path/to/file.xlsx` でローカルファイルを使えます。

## データ項目（data.json の構造）

```json
{
  "published_date": "2026-05-29",
  "source_url": "https://www.mhlw.go.jp/content/10800000/260529iyakuhinkyoukyu.xlsx",
  "fetched_at": "2026-07-08T05:00:00+09:00",
  "item_count": 1234,
  "items": [
    {
      "ingredient": "成分名（一般名）",
      "brand": "販売名",
      "maker": "製造販売業者",
      "spec": "規格・剤形",
      "supply_status": "限定出荷（他社品の影響）",
      "supply_status_code": "限定出荷_他社影響",
      "volume_status": "B",
      "resume_prospect": "供給再開見込み時期",
      "is_new": true,
      "source_sheet": "シート名"
    }
  ]
}
```

出荷対応の区分コード（`supply_status_code`）:

| コード | 意味 |
| --- | --- |
| `通常出荷` | ①通常出荷 |
| `限定出荷_自社事情` | ②限定出荷（自社の事情） |
| `限定出荷_他社影響` | ③限定出荷（他社品の影響） |
| `限定出荷_その他` | ④限定出荷（その他） |
| `限定出荷` | 区分を特定できない限定出荷 |
| `供給停止` | ⑤供給停止 |
| `不明` | いずれにも分類できなかった |

## 列構成が変わったときの直し方

厚労省の Excel はヘッダ表記・シート構成が改定で変わることがあります。
スクリプトは**列名の部分一致キーワード**で列を検出しているため、変化には
以下の手順で追従します。

1. まず実データの構造を確認する:
   ```bash
   python scripts/fetch_and_convert.py --inspect
   ```
   → シート名・先頭 20 行・列レイアウトが出力されます。
2. `scripts/fetch_and_convert.py` 冒頭の **`COLUMN_KEYWORDS`** を、
   実際の見出し文言に合わせて追記・修正します
   （例: 「販売名」が「品名」に変わったら `brand` のリストに追加）。
3. 出荷対応の分類が変わった場合は **`SUPPLY_STATUS_RULES`** を調整します。
4. `python scripts/fetch_and_convert.py` を実行し、`item_count` が妥当か、
   画面表示が崩れていないかを確認します。

スクリプトは、ヘッダ行を特定できない・必須列が無い・1 件も抽出できない場合に
`StructureError` で異常終了します。ワークフローが失敗したら、まず `--inspect` で
構造を確認してください。

## 免責

本ツールは厚労省公開データを自動処理した**非公式の検索補助ツール**であり、
抽出漏れ・誤りを含む可能性があります。算定・調剤・在庫判断は必ず
原文 Excel（画面のリンク）および一次情報でご確認ください。

- データ元: [厚生労働省「医療用医薬品供給状況」](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/kouhatu-iyaku/04_00003.html)
