import * as vscode from 'vscode';

import { PushDataPoint } from '../Data/Data';
import { DataPoint } from '../Data/DataPoint';

import { GetLineNumberFromUser } from './UserInput/GetLineNumberFromUser';
import { GetDetailFromUser } from './UserInput/GetDetailFromUser';
import { GetLinkedDataPointFromUser } from './UserInput/GetDataPointFromUser';

import { generateDataPointId } from '../Utils/generateDataPointId';
import { getActiveFile } from '../Utils/getActiveFile';

/**
 * Asynchronous function that creates a new DataPoint and adds it to the global state.
 */
export async function CreateDataPoint() {
  let dataPoint = new DataPoint();

  dataPoint.lineNumber = await GetLineNumberFromUser();
  dataPoint.detail = await GetDetailFromUser();
  dataPoint.id = await generateDataPointId();

  let linkedDataPoint = await GetLinkedDataPointFromUser();

  if (linkedDataPoint !== undefined) {
    dataPoint.linkedDataPoints.push(linkedDataPoint.id);
  }

  dataPoint.file = await getActiveFile();

  PushDataPoint(dataPoint);
  vscode.window.showInformationMessage('Added data point with ID: ' + dataPoint.id);
}
