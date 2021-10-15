import { FunctionComponent, SVGProps } from 'react';

import { DriveFileData, DriveFolderData } from '../../models/interfaces';
import { TaskStatus, TaskType } from './enums';

interface BaseTask {
  id: string;
  relatedTaskId?: string;
  action: TaskType;
  status: TaskStatus;
  progress: number;
  cancellable: boolean;
  showNotification: boolean;
  stop?: () => Promise<void>;
}

export interface CreateFolderTask extends BaseTask {
  action: TaskType.CreateFolder;
  cancellable: false;
  folderName: string;
  parentFolderId: number;
}

export interface DownloadFileTask extends BaseTask {
  action: TaskType.DownloadFile;
  cancellable: true;
  file: { name: string; type: string };
}

export interface DownloadFolderTask extends BaseTask {
  action: TaskType.DownloadFolder;
  cancellable: true;
  folder: { id: number; name: string };
  compressionFormat: string;
}

export interface DownloadBackupTask extends BaseTask {
  action: TaskType.DownloadBackup;
  cancellable: true;
  backup: { name: string; type: string };
}

export interface UploadFileTask extends BaseTask {
  action: TaskType.UploadFile;
  cancellable: true;
  fileName: string;
  fileType: string;
  isFileNameValidated: boolean;
}

export interface UploadFolderTask extends BaseTask {
  action: TaskType.UploadFolder;
  cancellable: true;
  folderName: string;
}

export interface MoveFileTask extends BaseTask {
  action: TaskType.MoveFile;
  cancellable: false;
  file: DriveFileData;
  destinationFolderId: number;
}

export interface MoveFolderTask extends BaseTask {
  action: TaskType.MoveFolder;
  cancellable: false;
  folder: DriveFolderData;
  destinationFolderId: number;
}

export type TaskData =
  | CreateFolderTask
  | DownloadFileTask
  | DownloadFolderTask
  | DownloadBackupTask
  | UploadFileTask
  | UploadFolderTask
  | MoveFileTask
  | MoveFolderTask;

export interface NotificationData {
  taskId: string;
  status: TaskStatus;
  title: string;
  subtitle: string;
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  progress: number;
  isTaskCancellable: boolean;
}

export interface TaskFilter {
  relatedTaskId?: string;
  status?: TaskStatus[];
}

export interface UpdateTaskPayload {
  taskId: string;
  merge: Partial<TaskData>;
}
