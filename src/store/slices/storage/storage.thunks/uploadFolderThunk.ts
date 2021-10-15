import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';

import { StorageState } from '../storage.model';
import { RootState } from '../../..';
import i18n from '../../../../services/i18n.service';
import notificationsService, { ToastType } from '../../../../services/notifications.service';
import { uploadItemsThunk } from './uploadItemsThunk';
import errorService from '../../../../services/error.service';
import { TaskProgress, TaskStatus, TaskType } from '../../../../services/task-manager.service/enums';
import { deleteItemsThunk } from './deleteItemsThunk';
import { DriveFolderData, DriveItemData } from '../../../../models/interfaces';
import storageThunks from '.';
import { UploadFolderTask } from '../../../../services/task-manager.service/interfaces';
import taskManagerService from '../../../../services/task-manager.service';

export interface IRoot {
  name: string;
  folderId: number | null;
  childrenFiles: File[];
  childrenFolders: IRoot[];
  fullPathEdited: string;
}

interface UploadFolderThunkPayload {
  root: IRoot;
  currentFolderId: number;
  options?: {
    withNotification?: boolean;
    onSuccess?: () => void;
  };
}

export const uploadFolderThunk = createAsyncThunk<void, UploadFolderThunkPayload, { state: RootState }>(
  'storage/createFolderStructure',
  async ({ root, currentFolderId, options }, { dispatch, requestId }) => {
    options = Object.assign({ withNotification: true }, options || {});

    let alreadyUploaded = 0;
    let rootFolderItem: DriveFolderData | undefined;
    const levels = [root];
    const itemsUnderRoot = countItemsUnderRoot(root);
    const task: UploadFolderTask = {
      id: requestId,
      action: TaskType.UploadFolder,
      status: TaskStatus.Pending,
      progress: TaskProgress.Min,
      folderName: root.name,
      showNotification: !!options.withNotification,
      cancellable: true,
      stop: async () => {
        const relatedTasks = taskManagerService.getTasks({ relatedTaskId: requestId });
        const promises: Promise<void>[] = [];

        // Cancels related tasks
        promises.push(
          ...(relatedTasks.map((task) => task.stop?.()).filter((promise) => promise !== undefined) as Promise<void>[]),
        );

        // Deletes the root folder
        if (rootFolderItem) {
          promises.push(dispatch(deleteItemsThunk([rootFolderItem as DriveItemData])).unwrap());
        }

        await Promise.all(promises);
      },
    };

    taskManagerService.addTask(task);

    try {
      root.folderId = currentFolderId;

      while (levels.length > 0) {
        const level: IRoot = levels.shift() as IRoot;
        const [createdFolder] = await dispatch(
          storageThunks.createFolderThunk({
            parentFolderId: level.folderId as number,
            folderName: level.name,
            options: { relatedTaskId: task.id, showErrors: false },
          }),
        ).unwrap();

        rootFolderItem = createdFolder;

        if (level.childrenFiles) {
          for (const childrenFile of level.childrenFiles) {
            await dispatch(
              uploadItemsThunk({
                files: [childrenFile],
                parentFolderId: createdFolder.id,
                folderPath: level.fullPathEdited,
                options: { relatedTaskId: task.id, showNotifications: false, showErrors: false },
              }),
            ).unwrap();

            taskManagerService.updateTask({
              taskId: task.id,
              merge: {
                status: TaskStatus.InProcess,
                progress: ++alreadyUploaded / itemsUnderRoot,
              },
            });
          }
        }

        for (const child of level.childrenFolders) {
          child.folderId = createdFolder.id;
        }

        levels.push(...level.childrenFolders);
      }

      taskManagerService.updateTask({
        taskId: task.id,
        merge: {
          status: TaskStatus.Success,
        },
      });

      options.onSuccess?.();
    } catch (err: unknown) {
      const castedError = errorService.castError(err);
      const updatedTask = taskManagerService.findTask(task.id);

      if (updatedTask?.status !== TaskStatus.Cancelled) {
        taskManagerService.updateTask({
          taskId: task.id,
          merge: {
            status: TaskStatus.Error,
          },
        });

        throw castedError;
      }
    }
  },
);

function countItemsUnderRoot(root: IRoot): number {
  let count = 0;

  const queueOfFolders: Array<IRoot> = [root];

  while (queueOfFolders.length) {
    const folder = queueOfFolders.shift() as IRoot;

    count += folder.childrenFiles?.length ?? 0;

    queueOfFolders.push(...folder.childrenFolders);
  }

  return count;
}

export const uploadFolderThunkExtraReducers = (builder: ActionReducerMapBuilder<StorageState>): void => {
  builder
    .addCase(uploadFolderThunk.pending, () => undefined)
    .addCase(uploadFolderThunk.fulfilled, () => undefined)
    .addCase(uploadFolderThunk.rejected, (state, action) => {
      let errorMessage = i18n.get('error.uploadingFolder');

      if (action.error.message?.includes('already exists')) {
        errorMessage = i18n.get('error.folderAlreadyExists');
      } else {
        errorMessage = action.error.message || action.error + '';
      }

      notificationsService.show(errorMessage, ToastType.Error);
    });
};
