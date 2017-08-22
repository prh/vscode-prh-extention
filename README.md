# prh extention for VSCode

本拡張は[VSCode](https://code.visualstudio.com/)向けです。

[prh](https://github.com/prh/prh)と[prh-languageserver](https://github.com/prh/prh-languageserver)を利用しての文書校正を支援します。
それぞれ、prhコマンドとprhlsコマンドが提供されています。

## 導入方法

VSCodeがインストールされていれば、[このリンク](vscode:extension/vvakame.vscode-prh-extention)で導入を開始することができます。

もしくは、VSCodeを開いて `Cmd+P`（`Ctrl+P`）でコマンドパレットを開きます。
そこで `ext install prh` を実行すると本拡張が検索できます。

## 使い方

prhの使い方や設定は[本体の説明](https://github.com/prh/prh/blob/master/README.md)を参照してください。

本拡張ではMarkdown、Re:VIEW文章に対してVSCode上でリアルタイムに校正の指摘を確認することができます。
校正の指摘はQuick Fixとして提供されるので、VSCodeの標準的な操作で修正を適用することができます。

コマンドパレット経由で `prh: Apply All Quick Fixes` を提供しています。
1ファイルに対して全ての指摘を自動的に反映させることができます。

## 動作について

本拡張は基本的にバンドルされたprhlsを利用します。
prhlsが提供する機能はprhコマンド経由で提供される機能と同等です。

## 設定

本拡張に対して、[設定](https://code.visualstudio.com/docs/getstarted/settings)からいくつかのオプションを与えることができます。

```
{
    // prhによるチェックを行うか行わないか
    "prh.enable": true,
    // prhlsコマンドの場所を明示的に指定する
    "prh.prhlsPath": "./node_modules/.bin/prhls",
    // 校正ルールファイルの場所 prhコマンドで--rulesでの指定と同等
    "prh.configFiles": [
        "prh.yml"
    ],
    // prhlsからのログ出力レベル
    "prh.trace.server": "off"
}
```

プロジェクト毎にワークスペースに対して設定を行うのをお勧めします。
npmの依存関係にprhとprh-languageserverを追加し、次の設定を利用します。

```
{
    // prhlsコマンドの場所を明示的に指定する
    "prh.prhlsPath": "./node_modules/.bin/prhls"
}
```

## デバッグ方法

本プロジェクトをVSCodeで開き、F5キーでデバッグ実行が可能。

次の事を行うと拡張以外を含めた開発が便利になる。
prh-languageserverを手元にcloneしビルドし、prhlsPathでそちらを参照させる。

## リリース方法メモ

see https://code.visualstudio.com/docs/extensions/publish-extension

```
$ npm install -g vsce
$ vsce publish patch
```
