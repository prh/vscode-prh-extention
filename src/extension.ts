import * as path from "path";

import * as vscode from "vscode";
import {
    LanguageClient, LanguageClientOptions,
    SettingMonitor, ServerOptions,
    TransportKind, ExecuteCommandRequest, ExecuteCommandParams
} from "vscode-languageclient";

export class Handler {
    context?: vscode.ExtensionContext;
    statusBarItem?: vscode.StatusBarItem;
    client?: LanguageClient;

    activate(context: vscode.ExtensionContext) {
        this.context = context;
        this.setupStatusBarItem();
        this.setupLanguageClient();

        {
            const disposable = new SettingMonitor(this.client!, "prh.enable").start();
            context.subscriptions.push(disposable);
        }
        {
            let disposable = vscode.commands.registerCommand("prh.applyAllQuickFixes", this.commandApplyAllQuickFixes.bind(this));
            context.subscriptions.push(disposable);
        }
        {
            let disposable = vscode.commands.registerCommand("prh.openOutputChannel", this.commandOutputChannel.bind(this));
            context.subscriptions.push(disposable);
        }
    }

    setupStatusBarItem() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.statusBarItem.text = "prh";
        this.statusBarItem.command = "prh.applyAllQuickFixes";
        this.statusBarItem.show();
    }

    setupLanguageClient() {
        if (!this.context) {
            return;
        }
        let serverModule = this.context.asAbsolutePath(path.join("./node_modules/prh-languageserver", "lib/index.js"));
        // let serverModule = this.context.asAbsolutePath(path.join("../prh-languageserver", "lib/index.js"));
        // let debugOptions = { execArgv: ["--nolazy", "--debug=6009", "--inspect", "--debug-brk"] };
        let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
        let serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
        };
        let clientOptions: LanguageClientOptions = {
            documentSelector: ["plaintext", "markdown", "review"],
            synchronize: {
                configurationSection: "prh",
                // prh.ymlから別のファイルをimportsしてる場合に変更が検出できないと辛いので広めに取る
                fileEvents: vscode.workspace.createFileSystemWatcher("**/*.yml"),
            },
        };

        this.client = new LanguageClient("prh", "prh", serverOptions, clientOptions);
        let disposable = this.client.start();
        this.context.subscriptions.push(disposable);
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
