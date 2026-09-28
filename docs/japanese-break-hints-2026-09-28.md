# Japanese category names: break hints for the taxonomy (2026-09-28)

A request from Kozmos to the owners of the Pointr taxonomy's Japanese translations. It follows
Olcay's decision 18 (`docs/handoff-2026-09-27-night.md` §4): Kozmos keeps its two-line tiles, and
the names get break hints. The exact strings are in
[japanese-break-hints-2026-09-28.json](japanese-break-hints-2026-09-28.json).

## The ask

Insert **U+200B ZERO WIDTH SPACE** where the tables below show `｜`, in the Japanese names of
taxonomy **10.13.0** (the current release):

- **89 names** then fit the tile's two lines and break only at the hint, in Chromium, Firefox and
  WebKit, at every phone width measured.
- **8 names** need three lines even with hints. The tile cuts them at two lines; only a shorter name
  fixes them.

22 of the 97 names are quick-access category names; the rest are type names.

## Why the data, not Kozmos

Kozmos's category tile (`CategoryTile` in `BrowseCategoriesPanel`, and the quick-access tiles) shows
a name in at most two lines of 11px text, on a 14px line. On a phone the text box is 67.5–75.5px wide:
six full-width characters to a line. For Japanese the tile keeps words whole (`word-break: keep-all`),
because "レストラン" split across two lines reads as two words that don't exist.

A name that doesn't fit in two lines of whole words fails in one of two ways today:

- **A forced break at an arbitrary character:** カスタマーサ / ービス. This puts ー at the start of a
  line, which Japanese line breaking forbids.
- **A third line,** which the two-line clamp cuts.

The browser cannot find the words itself:

- ICU's segmenter splits katakana compounds wrongly (カス / タマ / ー / サービス).
- Chromium's `word-break: auto-phrase` changes nothing for these names.
- WebKit (Safari, and every browser on iOS) doesn't break after "・" under `keep-all`, so even
  names joined with "・" break mid-word there.

A U+200B is invisible, and every engine treats it as a place to break. iOS and Android text do too.

## One caveat: search and matching

A U+200B makes a different string. Search, sorting and any exact matching of Japanese names must
strip U+200B first. Otherwise a visitor who types カスタマーサービス will not match カスタマー + U+200B + サービス.
Screen readers ignore it.

## Method

- **Names:** taxonomy 10.13.0 (`version-info.txt`'s current release). This is the `name_ja` of
  every quick-access category in all 70 quick-access files: ten sectors, each with the vertical file
  and six persona slices, giving 53 unique names. Added to it is every type name in
  `i18n/web/translation.ja.json` → `Types` (362 keys). That makes **398** unique names.
- **Box:** the real Kozmos `BrowseCategoriesPanel` and `CategoryTile`, built from `main`
  (`934403a6`), with `lang="ja"`. Panel widths were 390px (a 75.5px label), 360px (68px) and 358px
  (67.5px: a 390px phone with 16px side insets). They ran in Chromium, Firefox and WebKit under
  Playwright, in the host's system font (Hiragino Sans on macOS).
- **Lines:** each line is read from the per-character `Range.getClientRects()` tops. A name needs
  a hint when, at any width in any engine, it takes three lines or breaks between two word
  characters. Under `keep-all`, only a forced break can do that.
- **Results:** **97** names needed a hint. Each proposal was measured the same way.

## 89 names that fit two lines with hints

`｜` marks U+200B. "Today" is the worst wrap measured (↵ is a line break), with its engine and panel
width.

| #   | Name today               | Where                                                     | Today                                          | With hints                   |
| --- | ------------------------ | --------------------------------------------------------- | ---------------------------------------------- | ---------------------------- |
| 1   | ウェルネス・祈り         | quick access "Wellness & Spirituality" (70 files)         | ウェルネス・祈 ↵ り [webkit 390]               | ウェルネス・｜祈り           |
| 2   | 案内・サポート           | quick access "Information & Help" (70 files)              | 案内・サポー ↵ ト [webkit 358]                 | 案内・｜サポート             |
| 3   | バリアフリー施設         | quick access "Accessible Places" (70 files)               | バリアフリー ↵ 施設 [chromium 390]             | バリアフリー｜施設           |
| 4   | ヴィーガン・ベジタリアン | quick access "Vegan & Vegetarian" (70 files)              | ヴィーガン・ベ ↵ ジタリアン [webkit 390]       | ヴィーガン・｜ベジタリアン   |
| 5   | 保安検査・入国審査       | quick access "Security & Immigration" (7 files)           | 保安検査・入国 ↵ 審査 [webkit 390]             | 保安検査・｜入国審査         |
| 6   | カスタマーサービス       | quick access "Customer Service" (7 files)                 | カスタマーサ ↵ ービス [chromium 390]           | カスタマー｜サービス         |
| 7   | 駐車場・地上交通         | quick access "Parking & Ground Transport" (7 files)       | 駐車場・地上交 ↵ 通 [webkit 390]               | 駐車場・｜地上交通           |
| 8   | リハビリ・治療           | quick access "Rehab & Therapy" (6 files)                  | リハビリ・治 ↵ 療 [webkit 358]                 | リハビリ・｜治療             |
| 9   | 店舗・ショッピング       | quick access "Stores & Shopping" (7 files)                | 店舗・ショッピ ↵ ング [webkit 390]             | 店舗・｜ショッピング         |
| 10  | フード・ドリンク         | quick access "Food & Drink" (14 files)                    | フード・ドリン ↵ ク [webkit 390]               | フード・｜ドリンク           |
| 11  | エンターテインメント     | quick access "Entertainment" (7 files)                    | エンターテイ ↵ ンメント [chromium 390]         | エンター｜テインメント ¹     |
| 12  | ワークスペース           | quick access "Workspaces" (4 files); Types.work-space     | ワークスペー ↵ ス [chromium 358]               | ワーク｜スペース             |
| 13  | サービス・サポート       | quick access "Services & Support" (7 files)               | サービス・サポ ↵ ート [webkit 390]             | サービス・｜サポート         |
| 14  | フード・カフェ           | quick access "Food & Cafés" (7 files)                     | フード・カフ ↵ ェ [webkit 358]                 | フード・｜カフェ             |
| 15  | 滞在・くつろぎ           | quick access "Stay & Comfort" (7 files)                   | 滞在・くつろ ↵ ぎ [webkit 358]                 | 滞在・｜くつろぎ             |
| 16  | リラックス・遊び         | quick access "Relax & Play" (7 files)                     | リラックス・遊 ↵ び [webkit 390]               | リラックス・｜遊び           |
| 17  | ゲストサービス           | quick access "Guest Services" (7 files)                   | ゲストサービ ↵ ス [chromium 390]               | ゲスト｜サービス             |
| 18  | チケット・案内           | quick access "Tickets & Info" (7 files)                   | チケット・案 ↵ 内 [webkit 358]                 | チケット・｜案内             |
| 19  | トラベルサービス         | quick access "Travel Services" (7 files)                  | トラベルサー ↵ ビス [chromium 390]             | トラベル｜サービス           |
| 20  | 駐車場・乗り継ぎ         | quick access "Parking & Connections" (7 files)            | 駐車場・乗り継 ↵ ぎ [webkit 390]               | 駐車場・｜乗り継ぎ           |
| 21  | アパートメント           | Types.accommodation-space_apartment                       | アパートメン ↵ ト [chromium 358]               | アパート｜メント ¹           |
| 22  | アクティビティスペース   | Types.activity-space                                      | アクティビテ ↵ ィスペース [chromium 390]       | アクティビ｜ティ｜スペース ¹ |
| 23  | ボウリングレーン         | Types.activity-space_bowling-alley                        | ボウリングレ ↵ ーン [chromium 390]             | ボウリング｜レーン           |
| 24  | クライミングウォール     | Types.activity-space_climbing-wall                        | クライミング ↵ ウォール [chromium 390]         | クライミング｜ウォール       |
| 25  | フィットネススタジオ     | Types.activity-space_fitness-studio                       | フィットネス ↵ スタジオ [chromium 390]         | フィットネス｜スタジオ       |
| 26  | キッズスペース           | Types.activity-space_play-area                            | キッズスペー ↵ ス [chromium 358]               | キッズ｜スペース             |
| 27  | スポーツコート           | Types.activity-space_sports-court                         | スポーツコー ↵ ト [chromium 390]               | スポーツ｜コート             |
| 28  | サービススペース         | Types.amenity-space                                       | サービススペ ↵ ース [chromium 390]             | サービス｜スペース           |
| 29  | エレベーターホール       | Types.circulation-space_elevator-lobby                    | エレベーター ↵ ホール [chromium 390]           | エレベーター｜ホール         |
| 30  | 装飾・環境要素           | Types.decorative-environmental-feature                    | 装飾・環境要 ↵ 素 [webkit 358]                 | 装飾・｜環境要素             |
| 31  | コンピューター室         | Types.education-space_computer-lab                        | コンピュータ ↵ ー室 [chromium 390]             | コンピュー｜ター室 ¹         |
| 32  | 緊急・安全スペース       | Types.emergency-safety-space                              | 緊急・安全スペ ↵ ース [webkit 390]             | 緊急・｜安全｜スペース       |
| 33  | ゲームセンター           | Types.entertainment-space_arcade                          | ゲームセンタ ↵ ー [chromium 358]               | ゲーム｜センター             |
| 34  | コンサートホール         | Types.entertainment-space_concert-hall                    | コンサートホ ↵ ール [chromium 390]             | コンサート｜ホール           |
| 35  | 手荷物ターンテーブル     | Types.equipment_baggage-reclaim-carousel                  | 手荷物ターン ↵ テーブル [chromium 390]         | 手荷物｜ターン｜テーブル     |
| 36  | 充電ステーション         | Types.equipment_charging-station                          | 充電ステーシ ↵ ョン [chromium 390]             | 充電｜ステーション           |
| 37  | 消毒液ディスペンサー     | Types.equipment_sanitizer-dispenser                       | 消毒液ディスペ ↵ ンサー [chromium 390]         | 消毒液｜ディス｜ペンサー ¹   |
| 38  | スプリンクラー           | Types.equipment_sprinkler                                 | スプリンクラ ↵ ー [chromium 390]               | スプリン｜クラー ¹           |
| 39  | X 線検査コンベア         | Types.equipment_x-ray-conveyor-belt                       | X ↵ 線検査コンベ ↵ ア (3 lines) [chromium 390] | X 線検査｜コンベア           |
| 40  | イベントスペース         | Types.event-space                                         | イベントスペー ↵ ス [chromium 390]             | イベント｜スペース           |
| 41  | 多宗教対応の祈祷室       | Types.faith-worship-space_multi-faith-room                | 多宗教対応の ↵ 祈祷室 [chromium 390]           | 多宗教｜対応の｜祈祷室       |
| 42  | セルフサービス食堂       | Types.food-beverage-space_cafeteria                       | セルフサービ ↵ ス食堂 [chromium 390]           | セルフ｜サービス｜食堂       |
| 43  | ドリンクスタンド         | Types.food-beverage-space_drink-stall                     | ドリンクスタ ↵ ンド [chromium 390]             | ドリンク｜スタンド           |
| 44  | ファストフード           | Types.food-beverage-space_fast-food                       | ファストフー ↵ ド [chromium 358]               | ファスト｜フード             |
| 45  | フードスタンド           | Types.food-beverage-space_food-stall                      | フードスタン ↵ ド [chromium 390]               | フード｜スタンド             |
| 46  | ゲームテーブル           | Types.furniture_game-table                                | ゲームテーブ ↵ ル [chromium 358]               | ゲーム｜テーブル             |
| 47  | ビーコンジオフェンス     | Types.geofence_beacon-geofence                            | ビーコンジオフ ↵ ェンス [chromium 390]         | ビーコン｜ジオフェンス       |
| 48  | 位置合わせ基準点         | Types.georeferencing-anchor                               | 位置合わせ基 ↵ 準点 [chromium 390]             | 位置合わせ｜基準点           |
| 49  | 下地・仕上げ工場         | Types.industrial-space_preparation-and-finishing-workshop | 下地・仕上げ工 ↵ 場 [webkit 390]               | 下地・｜仕上げ｜工場         |
| 50  | 品質保証エリア           | Types.industrial-space_quality-assurance-space            | 品質保証エリ ↵ ア [chromium 390]               | 品質保証｜エリア             |
| 51  | 再生・改修エリア         | Types.industrial-space_refurbishment                      | 再生・改修エリ ↵ ア [webkit 390]               | 再生・｜改修｜エリア         |
| 52  | 心臓カテーテル室         | Types.medical-space_cath-lab                              | 心臓カテーテ ↵ ル室 [chromium 390]             | 心臓｜カテーテル室           |
| 53  | 高気圧酸素治療室         | Types.medical-space_hyperbaric-chamber                    | 高気圧酸素治 ↵ 療室 [chromium 390]             | 高気圧｜酸素｜治療室         |
| 54  | 治療・リハビリ室         | Types.medical-space_therapy-rehabilitation-room           | 治療・リハビリ ↵ 室 [webkit 390]               | 治療・｜リハビリ室           |
| 55  | オーディトリアム         | Types.meeting-space_auditorium                            | オーディトリ ↵ アム [chromium 390]             | オーディ｜トリアム ¹         |
| 56  | 管理・設備スペース       | Types.operational-space                                   | 管理・設備スペ ↵ ース [webkit 390]             | 管理・｜設備｜スペース       |
| 57  | データセンター           | Types.operational-space_data-center                       | データセンタ ↵ ー [chromium 390]               | データ｜センター             |
| 58  | 自動車サービス           | Types.parking-space_car-repair-services                   | 自動車サービ ↵ ス [chromium 390]               | 自動車｜サービス             |
| 59  | トイレ・水回り           | Types.restroom-space                                      | トイレ・水回 ↵ り [webkit 358]                 | トイレ・｜水回り             |
| 60  | ベビーケア・衛生         | Types.restroom-space_baby-care-hygiene                    | ベビーケア・衛 ↵ 生 [webkit 390]               | ベビーケア・｜衛生           |
| 61  | ギフト包装カウンター     | Types.retail-space_gift-wrap-station                      | ギフト包装カ ↵ ウンター [chromium 390]         | ギフト｜包装｜カウンター     |
| 62  | アイランド什器           | Types.retail-space_island-display                         | アイランド什 ↵ 器 [chromium 390]               | アイランド｜什器             |
| 63  | パーソナルショッパー     | Types.retail-space_personal-shopper-assist                | パーソナルシ ↵ ョッパー [chromium 390]         | パーソナル｜ショッパー       |
| 64  | ポップアップストア       | Types.retail-space_pop-up                                 | ポップアップ ↵ ストア [chromium 390]           | ポップアップ｜ストア         |
| 65  | 返品カウンター           | Types.retail-space_returns-desk                           | 返品カウンタ ↵ ー [chromium 390]               | 返品｜カウンター             |
| 66  | 試食・試用コーナー       | Types.retail-space_sample-station                         | 試食・試用コー ↵ ナー [webkit 390]             | 試食・｜試用｜コーナー       |
| 67  | 税関・入国審査           | Types.section_customs-immigration                         | 税関・入国審 ↵ 査 [webkit 358]                 | 税関・｜入国審査             |
| 68  | 保安カウンター           | Types.security-space_security-desk                        | 保安カウンタ ↵ ー [chromium 390]               | 保安｜カウンター             |
| 69  | 待ち合わせ場所           | Types.social-space_meeting-point                          | 待ち合わせ場 ↵ 所 [chromium 390]               | 待ち合わせ｜場所             |
| 70  | 給茶・軽食コーナー       | Types.social-space_refreshment-room                       | 給茶・軽食コー ↵ ナー [webkit 390]             | 給茶・｜軽食｜コーナー       |
| 71  | サポートスペース         | Types.support-space                                       | サポートスペー ↵ ス [chromium 390]             | サポート｜スペース           |
| 72  | ナースステーション       | Types.support-space_nurse-station                         | ナースステー ↵ ション [chromium 390]           | ナース｜ステーション         |
| 73  | エスカレーター           | Types.transition_escalator                                | エスカレータ ↵ ー [chromium 390]               | エスカ｜レーター ¹           |
| 74  | 車椅子用リフト           | Types.transition_wheelchair-lift                          | 車椅子用リフ ↵ ト [chromium 390]               | 車椅子用｜リフト             |
| 75  | 到着出迎えエリア         | Types.transportation-space_arrivals-greeting-area         | 到着出迎えエ ↵ リア [chromium 390]             | 到着｜出迎え｜エリア         |
| 76  | 手荷物預け・チェックイン | Types.transportation-space_bag-drop-checkin               | 手荷物預け・チ ↵ ェックイン [webkit 390]       | 手荷物｜預け・｜チェックイン |
| 77  | バスターミナル           | Types.transportation-space_bus-station                    | バスターミナ ↵ ル [chromium 390]               | バス｜ターミナル             |
| 78  | 配車サービス乗り場       | Types.transportation-space_rideshare-pickup               | 配車サービス ↵ 乗り場 [chromium 390]           | 配車｜サービス｜乗り場       |
| 79  | シャトルバス乗り場       | Types.transportation-space_shuttle-station                | シャトルバス ↵ 乗り場 [chromium 390]           | シャトル｜バス｜乗り場       |
| 80  | カスタム移動ノード       | Types.wayfinding-network_custom-transition                | カスタム移動 ↵ ノード [chromium 390]           | カスタム｜移動｜ノード       |
| 81  | エレベーターノード       | Types.wayfinding-network_elevator-node                    | エレベーターノ ↵ ード [chromium 390]           | エレベーター｜ノード         |
| 82  | ウェルネススペース       | Types.wellness-space                                      | ウェルネスス ↵ ペース [chromium 390]           | ウェルネス｜スペース         |
| 83  | スパトリートメント室     | Types.wellness-space_spa-treatment-room                   | スパトリート ↵ メント室 [chromium 390]         | スパ｜トリート｜メント室 ¹   |
| 84  | スチームサウナ           | Types.wellness-space_steam-room                           | スチームサウ ↵ ナ [chromium 390]               | スチーム｜サウナ             |
| 85  | パーティション席         | Types.work-space_office-cubicle                           | パーティショ ↵ ン席 [chromium 390]             | パーティ｜ション席 ¹         |
| 86  | オープンオフィス         | Types.work-space_open-plan-office                         | オープンオフィ ↵ ス [chromium 390]             | オープン｜オフィス           |
| 87  | シェアオフィス           | Types.work-space_shared-office                            | シェアオフィ ↵ ス [chromium 390]               | シェア｜オフィス             |
| 88  | タッチダウン席           | Types.work-space_touchdown                                | タッチダウン ↵ 席 [chromium 390]               | タッチ｜ダウン席             |
| 89  | ワークステーション       | Types.work-space_workstation                              | ワークステー ↵ ション [chromium 390]           | ワーク｜ステーション         |

¹ A hint inside one loanword (10 names). None of them has a word boundary where both
halves fit a line: a seven-character loanword needs splitting. The hint sits at a syllable boundary
that keeps ー and small kana off the start of a line, for example エスカ｜レーター. A shorter name
is the alternative.

## 8 names that need three lines even with hints

Each is longer than twelve characters, or holds a word of seven or more, and a line holds six.
The tile shows two lines and cuts the rest, so for these the fix is a shorter name. The JSON
gives them no hinted form.

| Name                          | Where                                                      | Today                                                         | With hints                       | Recommendation                                                                                                       |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| オンライン注文・店舗受取      | quick access "Click & Collect" (7 files)                   | オンライン注 ↵ 文・店舗受取 [chromium 390]                    | オンライン｜注文・｜店舗受取     | A shorter name, and **no hints**: today it shows in two lines, broken mid-word; with hints it takes three and is cut |
| コラボレーション・イベント    | quick access "Collaboration & Events" (7 files)            | コラボレーシ ↵ ョン・ ↵ イベント (3 lines) [chromium 390]     | コラボレーション・｜イベント     | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| ランドマーク / アトラクション | Types.decorative-environmental-feature_landmark-attraction | ランドマーク ↵ / ↵ アトラクシ ↵ ョン (3 lines) [chromium 358] | ランドマーク / アトラクション    | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| エンターテインメントスペース  | Types.entertainment-space                                  | エンターテイ ↵ ンメントスペ ↵ ース (3 lines) [chromium 390]   | エンター｜テインメント｜スペース | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| スポーツ用品・アクセサリー    | Types.equipment_sports-equipment-accessories               | スポーツ用品 ↵ ・アクセサリ ↵ ー (3 lines) [webkit 358]       | スポーツ｜用品・｜アクセサリー   | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| フード・ドリンクスタンド      | Types.food-beverage-space_food-drink-stall                 | フード・ ↵ ドリンクスタ ↵ ンド (3 lines) [chromium 390]       | フード・｜ドリンク｜スタンド     | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| ジュース・スムージーバー      | Types.food-beverage-space_juice-smoothie-bar               | ジュース・ ↵ スムージーバ ↵ ー (3 lines) [chromium 390]       | ジュース・｜スムージー｜バー     | A shorter name. Hints only move the breaks; the tile still cuts it                                                   |
| エスカレーターノード          | Types.wayfinding-network_escalator-node                    | エスカレータ ↵ ーノード [chromium 390]                        | エスカ｜レーター｜ノード         | A shorter name, and **no hints**: today it shows in two lines, broken mid-word; with hints it takes three and is cut |
