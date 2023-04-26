import * as vscode from 'vscode';

import DataPoint from '../Data/DataPoint';
import { PushDataPointToDataStorage } from '../Data/DataStorage';
import Editor from './Editor';
import getCurrentOrderId from '../Utils/getCurrentOrderId';
import AskUserForInput from './AskUserForInput';

/**
 * Get the active file and line number and then a name and some detail from the user;
 * Use this data to create a new Data Point and push it to Data Storage.
 */
const AddDataPoint = async () => {
    try {
        const textEditor = vscode.window.activeTextEditor;
        const editor = Editor.fromTextEditor(textEditor);
        const lineNumber = editor.GetActiveLineNumber();
        let name: string = "UNKNOWN FUNCTION NAME";
        let symbols: vscode.DocumentSymbol[] | undefined;
        let enabled_symbols: SymbolKind[] = [SymbolKind.Method, SymbolKind.Function];
        symbols = await findSymbols(enabled_symbols);
        if (!symbols){
            console.log("NO SYMBOLS?!");
            vscode.window.showErrorMessage("NO SYMBOLS?!");
            return;
        }
        if(textEditor === undefined){
            return;
        }
        const position = textEditor.selection.active;

        const functionSymbols = symbols.filter(s => s.kind === SymbolKind.Function);

        console.log("Function Symbols:");
        for (const funcSymbol of functionSymbols) {
            console.log(funcSymbol);
            if (funcSymbol.range.contains(position)){
                console.log("We're in "+funcSymbol.name);
                name = funcSymbol.name;
            } else {
                console.log("We're NOT in "+funcSymbol.name);
            }
        }

        const file = editor.GetActiveFileName();
        const orderId = getCurrentOrderId();
        // const name = await AskUserForInput('Enter a name for this Data Point');
        const detail = await AskUserForInput('Enter some extra information about this Data Point');
        const dataPoint = new DataPoint(lineNumber, name, detail, file, orderId);



        PushDataPointToDataStorage(dataPoint);
        vscode.window.showInformationMessage(`${dataPoint.name} | ${file}:${lineNumber} Created!`);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
            vscode.window.showErrorMessage(error.message);
        } else {
            console.log('Unexpected error', error);
        }
    }
};

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { commands, DocumentSymbol, SymbolKind, TextDocument, window, workspace } from "vscode";

function getSymbolsFrom(symbol: DocumentSymbol, level: number): DocumentSymbol[] {

    const maxDepth: number = 4;
    // const maxDepth: number = workspace.getConfiguration("separators", window.activeTextEditor?.document).get("maxDepth", 0);
    if (maxDepth !== 0 && level >= maxDepth) {
        return [symbol];
    }

    if (symbol.children.length === 0) {
        return [symbol];
    }

    level++;
    const symbols: DocumentSymbol[] = [];
    symbols.push(symbol);
    for (const children of symbol.children) {
        if (children.children.length === 0) {
            symbols.push(children);
        } else {
            symbols.push(...getSymbolsFrom(children, level));
        }
    }
    return symbols;
}


export async function findSymbols(symbolsToFind: SymbolKind[]): Promise<DocumentSymbol[] | undefined> {
    if (!window.activeTextEditor) {
        return [];
    }

    const docSymbols = await commands.executeCommand(
        'vscode.executeDocumentSymbolProvider',
        window.activeTextEditor.document.uri
    ) as DocumentSymbol[];

    if (!docSymbols) {
        return undefined;
    }

    const symbols: DocumentSymbol[] = [];
    const level = 1;

    for (const symbol of docSymbols) {
        symbols.push(...getSymbolsFrom(symbol, level));
    }

    const docSymbolsFunctionsMethods = symbols
        ? symbols.filter(symbol => symbolsToFind.includes(symbol.kind) )
        : undefined;

    return docSymbolsFunctionsMethods;
}

export default AddDataPoint;
