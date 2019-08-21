import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.ngrev', () => {
		vscode.window.showInformationMessage('Hello ngrev');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
