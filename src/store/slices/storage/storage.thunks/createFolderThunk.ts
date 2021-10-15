import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';

import { StorageState } from '../storage.model';
import { storageActions, storageSelectors } from '..';
import { RootState } from '../../..';
import { DriveFolderData, DriveItemData } from '../../../../models/interfaces';
import folderService from '../../../../services/folder.service';
import i18n from '../../../../services/i18n.service';
import notificationsService, { ToastType } from '../../../../services/notifications.service';
import { TaskProgress, TaskStatus, TaskType } from '../../../../services/task-manager.service/enums';
import errorService from '../../../../services/error.service';
import { CreateFolderTask } from '../../../../services/task-manager.service/interfaces';
import taskManagerService from '../../../../services/task-manager.service';

interface CreateFolderThunkOptions {
  relatedTaskId: string;
  showErrors: boolean;
}
interface CreateFolderPayload {
  parentFolderId: number;
  folderName: string;
  options?: Partial<CreateFolderThunkOptions>;
}

export const createFolderThunk = createAsyncThunk<
  [DriveFolderData, CreateFolderTask],
  CreateFolderPayload,
  { state: RootState }
>(
  'storage/createFolder',
  async ({ folderName, parentFolderId, options }: CreateFolderPayload, { requestId, getState, dispatch }) => {
    options = Object.assign({ showErrors: true }, options || {});
    const currentFolderId = storageSelectors.currentFolderId(getState());

    try {
      const [createdFolderPromise, cancelTokenSource] = folderService.createFolder(parentFolderId, folderName);
      const task: CreateFolderTask = {
        id: requestId,
        relatedTaskId: options.relatedTaskId,
        action: TaskType.CreateFolder,
        status: TaskStatus.InProcess,
        progress: TaskProgress.Min,
        folderName: folderName,
        parentFolderId: parentFolderId,
        showNotification: false,
        cancellable: false,
        stop: async () => cancelTokenSource.cancel(),
      };

      taskManagerService.addTask(task);

      const createdFolder = await createdFolderPromise;
      const createdFolderNormalized: DriveFolderData = {
        ...createdFolder,
        name: folderName,
        parent_id: createdFolder.parentId,
        user_id: createdFolder.userId,
        icon: null,
        iconId: null,
        icon_id: null,
        isFolder: true,
        color: null,
        encrypt_version: null,
      };

      taskManagerService.updateTask({
        taskId: task.id,
        merge: {
          status: TaskStatus.Success,
          progress: TaskProgress.Max,
        },
      });

      if (currentFolderId === parentFolderId) {
        dispatch(
          storageActions.pushItems({
            folderIds: [currentFolderId],
            items: createdFolderNormalized as DriveItemData,
          }),
        );
      }

      return [createdFolderNormalized, task];
    } catch (err: unknown) {
      const castedError = errorService.castError(err);

      throw castedError;
    }
  },
);

export const createFolderThunkExtraReducers = (builder: ActionReducerMapBuilder<StorageState>): void => {
  builder
    .addCase(createFolderThunk.pending, () => undefined)
    .addCase(createFolderThunk.fulfilled, () => undefined)
    .addCase(createFolderThunk.rejected, (state, action) => {
      const requestOptions = Object.assign({ showErrors: true }, action.meta.arg.options || {});

      if (requestOptions?.showErrors) {
        const errorMessage = action.error.message?.includes('already exists')
          ? i18n.get('error.folderAlreadyExists')
          : i18n.get('error.creatingFolder');

        notificationsService.show(errorMessage, ToastType.Error);
      }
    });
};
