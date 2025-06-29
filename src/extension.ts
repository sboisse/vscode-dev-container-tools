import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

const revealInHostFileExplorer = async (resource: vscode.Uri) => {
  if (!resource) {
    vscode.window.showErrorMessage("No file selected.");
    return;
  }

  if (resource.scheme !== 'vscode-remote') {
    vscode.window.showErrorMessage("Selected file is not remote.");
    return;
  }

  const devContainerPrefix = "dev-container+";
  if (!resource.authority.startsWith(devContainerPrefix)) {
    vscode.window.showErrorMessage("Selected file authoority is not a dev container.");
    return;
  }

  const devContainerInfoHexString = resource.authority.substring(devContainerPrefix.length);
  const devContainerInfoString = Buffer.from(devContainerInfoHexString, 'hex').toString('utf8');
  const devContainerInfo = JSON.parse(devContainerInfoString);

  const relativePath = resource.path.substring("/workspace".length);
  const fullLocalPath = path.join(devContainerInfo.workspacePath, relativePath);
  
  await revealInFileExplorer(fullLocalPath);
}

const execAsync = async (command: string) => {
  return new Promise<void>((resolve, reject) => {
    exec(command, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

const revealInFileExplorer = async (resourcePath: string) => {
  let command: string;
  if (process.platform === 'win32') {
    command = `explorer /select,"${resourcePath}"`;
  } else if (process.platform === 'darwin') {
    command = `open -R "${resourcePath}"`;
  } else {
    // For Linux, we'll open the parent directory since xdg-open doesn't support selection
    const parentPath = path.dirname(resourcePath);
    command = `xdg-open "${parentPath}"`;
  }

  try {
    await execAsync(command);
  }
  catch (error: any) {
    vscode.window.showErrorMessage(`Failed to open file explorer: ${error.message}`);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('DevContainerTools.revealInHostFileExplorer', revealInHostFileExplorer);
  context.subscriptions.push(disposable);
}

export function deactivate() {}
