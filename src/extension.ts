import * as path from "path";

import * as vscode from "vscode";
import {
    LanguageClient, LanguageClientOptions,
    ServerOptions,
    TransportKind, ExecuteCommandRequest, ExecuteCommandParams
} from "vscode-languageclient";

export class Handler {
    context: vscode.ExtensionContext;
    statusBarItem?: vscode.StatusBarItem;
    client?: LanguageClient;
    clientDisposable?: vscode.Disposable;

    async activate(context: vscode.ExtensionContext) {
        this.context = context;

        {
            const disposable = vscode.commands.registerCommand("prh.applyAllQuickFixes", this.commandApplyAllQuickFixes.bind(this));
            this.context.subscriptions.push(disposable);
        }
        {
            const disposable = vscode.commands.registerCommand("prh.openOutputChannel", this.commandOutputChannel.bind(this));
            this.context.subscriptions.push(disposable);
        }
        vscode.workspace.onDidChangeConfiguration(async () => {
            await this.setupLanguageClient();
        });

        this.setupStatusBarItem();
        await this.setupLanguageClient();
    }

    setupStatusBarItem() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.statusBarItem.text = "prh";
        this.statusBarItem.command = "prh.applyAllQuickFixes";
        this.statusBarItem.show();
        this.context.subscriptions.push(this.statusBarItem);
    }

    async setupLanguageClient() {
        if (!this.context) {
            return;
        }

        if (this.clientDisposable) {
            this.clientDisposable.dispose();
            this.client = void 0;
            this.clientDisposable = void 0;
        }


        const disposables: vscode.Disposable[] = [];

        const conf = vscode.workspace.getConfiguration("prh");

        { // vscode-languageclient.SettingMonitor を使うとclientが二重管理状態になって辛いので自力でやる
            let enable = conf.get("enable") as boolean | null;
            if (enable == null) {
                enable = true;
            }
            if (!enable) {
                return;
            }
        }

        let prhlsPath = conf.get("prhlsPath") as string | null;
        if (prhlsPath) {
            prhlsPath = path.resolve(vscode.workspace.rootPath, prhlsPath);
        } else {
            // NOTE インストールされた拡張は node_modules/.bin を持たない…
            prhlsPath = this.context.asAbsolutePath("node_modules/prh-languageserver/bin/prhls");
        }

        const debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
        // const debugOptions = { execArgv: ["--nolazy", "--debug=6009", "--inspect", "--debug-brk"] };
        const serverOptions: ServerOptions = {
            run: { module: prhlsPath, transport: TransportKind.ipc },
            debug: { module: prhlsPath, transport: TransportKind.ipc, options: debugOptions },
        };
        const clientOptions: LanguageClientOptions = {
            documentSelector: ["plaintext", "markdown", "review"],
            synchronize: {
                configurationSection: "prh",
                // prh.ymlから別のファイルをimportsしてる場合に変更が検出できないと辛いので広めに取る
                fileEvents: vscode.workspace.createFileSystemWatcher("**/*.yml"),
            },
        };

        this.client = new LanguageClient("prh", "prh", serverOptions, clientOptions);
        const disposable = this.client.start();
        disposables.push(disposable);

        this.clientDisposable = vscode.Disposable.from(...disposables);
    }

    commandApplyAllQuickFixes() {
        if (!this.client) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const uri = editor.document.uri;
        const param: ExecuteCommandParams = {
            command: "applyAllQuickFixes",
            arguments: [uri.toString()],
        };
        this.client.sendRequest(ExecuteCommandRequest.type, param).then(_params => {
            vscode.window.showInformationMessage("All Quick Fixes Applied!");
        }, _error => {
            vscode.window.showErrorMessage("Failed: prh can't apply all quick fixes.");
        });
    }

    commandOutputChannel() {
        if (!this.client) {
            return;
        }

        this.client.outputChannel.show();
    }

    deactivate() {
        if (this.clientDisposable) {
            this.clientDisposable.dispose();
            this.client = void 0;
            this.clientDisposable = void 0;
        }
    }
}

let handler: Handler | null = null;

export function activate(context: vscode.ExtensionContext) {
    if (!handler) {
        handler = new Handler();
    }
    handler.activate(context);
}

export function deactivate() {
    if (handler) {
        handler.deactivate();
        handler = null;
    }
}
