# FoxSync2ch

## 概要

FoxAge2chのデータをSync2chで同期できるようにするアドオンです.

Firefox 3.6 - Firefox 17に対応していますが, 動作確認はFirefox Auroraでのみ行なっています.
また, 動作には FoxAge2ch の最新版, もしくは FoxAge2ch ex の最新版が必要です.


## 機能

- FoxAge2ch に登録されているスレッドを, 「お気に入り」として同期します.
- 開いているスレッド/板を同期します.
- FoxAge2chの更新確認時に自動的に同期します.

- FoxAge2chツールバーの「ツール」メニューに「Sync2chで同期」メニューなどを追加します.

- 同期時のログは, エラーコンソールに出力されます. 動作がおかしい時にはそちらもご確認下さい.


※以下の「設定項目について」や「制限事項」をよく読んでからの利用をお願いいたします.


## アカウントの設定方法

1. Sync2ch(https://sync2ch.com/)にて, アカウントを作成します.
2. 「アカウント設定」画面より, 「API接続用パスワード」を記録しておきます.
3. Sync2chの設定画面より, IDとPasswordを設定します.
   IDはメールアドレスとは違うので注意して下さい.
   また, Passwordはアカウントのパスワードではなく, API接続用パスワードなので注意して下さい.


## 設定項目について

- FoxAge2chが更新した時に同期する デフォルト値: ON
   FoxAge2chの更新確認が終了した時に, 自動的にSync2chと同期するようにします.
   OFFにすると, 手動によってのみ同期するようになります.

- FoxAge2chの板をお気に入りとして追加する デフォルト値: OFF
   FoxAge2chの板の一覧を, 「お気に入り」の「お気に入りの板」フォルダ内に追加して同期するようにします.
   FoxAge2ch上ではなにも変化は起こりませんが, 他のクライアントと同期する場合に有効な場合があるかもしれません.

- 「現在読んでいるレス番号」を「既読のレス番号」にする デフォルト値: OFF
   「開いているスレッド」の項目のうち, 「現在読んでいるレス番号」の値を「既読のレス番号」と同じ値にします.
   bbs2chreader/chaikaには「現在読んでいるレス番号」を取得する手段がないため,
   この機能をOFFにすると「現在読んでいるレス番号」には何もセットせず, 同期しないようになります.

- 開いている板を同期しない デフォルト値: OFF
   「開いているスレッド」の項目で「板」を同期しないようにします.
   bbs2chreader/chaika は「板」をタブで開くことができますが, クライアントによってはそれが不可能なものがあります(Jane Styleなど).
   そうしたクライアントでは, 同期が失敗することがあり, そのような場合にこの設定をONにすると解消することがあります.

- 開いているスレッド/板のオリジナルのURLを保存する デフォルト値: OFF
   「開いているスレッド」の項目のうち, URLの項目を実際に開いているURLと同じ値にします.
   OFFにすると http://127.0.0.1:8823/... などの専ブラのURLや, 末尾の「l30」などの部分がすべて削除されます.
   逆にONの場合には, それらはすべてオリジナルのまま保存されますが, 他のクライアントと同期した場合に不具合が発生する可能性があります.

- 更新されたスレッドを再読み込みする デフォルト値: OFF
   同期後に, 更新された「開いているスレッド」のタブを再読み込みします.
   自動的に bbs2chreader/chaika のdatも更新されるので, 読んでいた位置が失われる可能性があります.

- 未読/既読数を反映させる デフォルト値: OFF
   同期後に, 各項目の未読- 既読数をFoxAge2chに反映させます.
   bbs2chreader/chaika のdatは更新されないため, FoxAge2chの表す未読・既読数と実際の値が異なる状態となります.


## 制限事項

- 履歴は同期しません(FoxAge2chに履歴を保存する機能がないため).

- 「お気に入り」に板が入っている場合, それは消滅します(FoxAge2chは板をお気に入りにする機能がないため).

- 他のクライアントにて作成したフォルダは壊れ, FoxAge2chの階層構造に改変されます.
 「板名」がフォルダとなり, その下に各スレッドが格納されます(FoxAge2chにスレッドをフォルダで管理する機能がないため).

- 「現在読んでいる位置」は同期しません(取得する方法がないため).

- 開いている板については, 「閉じた」ことのみが同期されます(Sync2chにバグがあり, 板の同期ステータスが確認できないため).

- FoxAge2chに登録されていないスレッドの未読/既読数は同期されません(統一的に管理する方法がないため).


## 注意

- 他の専ブラ(2chmate, Jane Styleなど)と同期する場合, データ構造の違いから
 データが消える可能性があります(動作確認をしていません).
 事前にバックアップをすることを強く推奨します(FoxAge2chのデータはデフォルトではプロファイルフォルダ内の「foxage2ch」フォルダにあります).

- 初回同期時など, 一度に大量のデータが追加された場合, 板/スレッドタイトルの取得にかなり時間がかかることがあります(FoxAge2chの仕様です).

- 本アドオンは自動更新を行いませんので, 定期的に [アップローダー](http://bbs2ch.sourceforge.jp/uploader/upload.php) をご確認ください.

- 本アドオンにはバグが含まれる可能性がありますが,
 本アドオンを使用することにより発生したあらゆる損害(データ損失等を含む)について作者は責任を負いません.
 すべて自己責任にてご使用下さい.


## 更新履歴

### 0.0.2 - 2013/1/2 23:30
- 名前を「FoxSync2ch」に改名(http://anago.2ch.net/test/read.cgi/software/1349357076/599 様ありがとうございます)
- 以下の機能および設定を追加
   - 同期の状況をFoxAge2chを通じて通知する
   - 開いているスレッドのオリジナルURLを保存
   - 未読/既読数を反映
   - 現在読んでいるレス番号を既読レス番号にする
- 以下の設定を追加
   - 開いている板を同期しない
   - 板をお気に入りとして追加
- 「お気に入り」の項目が変更された場合に反映させるようにした
- Sync2chのメニューを「ツール」からFoxAge2chの「ツール」メニューに移動した
- 設定画面に同期番号をリセットするボタンを追加
- 「FoxAge2chが更新した時に同期する」の設定が即時に反映されるように変更
- すでに存在するスレッドをFoxAge2chに追加しようとすることがあるバグを修正
- 閉じられた板が同期されないバグを修正
- ログを詳細化

### 0.0.1 - 2013/1/1 15:00
- 初回リリース