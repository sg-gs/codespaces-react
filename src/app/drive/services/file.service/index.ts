import { items } from '@internxt/lib';
import { createHash } from 'crypto';
import { DriveFileData, DriveFileMetadataPayload, DriveItemData } from '../../types';
import analyticsService from '../../../analytics/services/analytics.service';
import errorService from '../../../core/services/error.service';
import httpService from '../../../core/services/http.service';
import localStorageService from '../../../core/services/local-storage.service';
import { DevicePlatform } from '../../../core/types';
import i18n from '../../../i18n/services/i18n.service';
import { UserSettings } from '../../../auth/types';
import uploadFile from './uploadFile';

export interface MoveFilePayload {
  fileId: string;
  destination: number;
  bucketId: string;
  relativePath: string;
}

export interface MoveFileResponse {
  item: DriveFileData;
  destination: number;
  moved: boolean;
}

interface RenameFileInNetworkPayload {
  fileId: string;
  bucketId: string;
  relativePath: string;
}

export function updateMetaData(
  fileId: string,
  metadata: DriveFileMetadataPayload,
  bucketId: string,
  relativePath: string,
): Promise<void> {
  const user = localStorageService.getUser() as UserSettings;
  const hashedRelativePath = createHash('ripemd160').update(relativePath).digest('hex');

  return httpService
    .post(`/api/storage/file/${fileId}/meta`, {
      metadata,
      bucketId,
      relativePath: hashedRelativePath,
    })
    .then(() => {
      analyticsService.trackFileRename({
        file_id: fileId,
        email: user.email,
        platform: DevicePlatform.Web,
      });
    });
}

export function deleteFile(fileData: DriveFileData): Promise<void> {
  const user = localStorageService.getUser() as UserSettings;

  return httpService.delete(`/api/storage/folder/${fileData.folderId}/file/${fileData.id}`).then(() => {
    analyticsService.trackDeleteItem(fileData as DriveItemData, {
      email: user.email,
      platform: DevicePlatform.Web,
    });
  });
}

export async function moveFile(
  file: DriveFileData,
  destination: number,
  destinationPath: string,
  bucketId: string,
): Promise<MoveFileResponse> {
  const user = localStorageService.getUser() as UserSettings;
  const relativePath = `${destinationPath}/${items.getItemDisplayName(file)}`;
  const hashedRelativePath = createHash('ripemd160').update(relativePath).digest('hex');

  const response = await httpService
    .post<MoveFilePayload, MoveFileResponse>('/api/storage/move/file', {
      fileId: file.fileId,
      destination,
      relativePath: hashedRelativePath,
      bucketId,
    })
    .catch((err) => {
      const castedError = errorService.castError(err);

      if (castedError.status) {
        castedError.message = i18n.get(`tasks.move-file.errors.${castedError.status}`);
      }

      throw castedError;
    });

  analyticsService.trackMoveItem('file', {
    file_id: response.item.id,
    email: user.email,
    platform: DevicePlatform.Web,
  });

  return response;
}

async function fetchRecents(limit: number): Promise<DriveFileData[]> {
  const response = await httpService.get<DriveFileData[]>(`/api/storage/recents?limit=${limit}`);

  return response;
}

async function renameFileInNetwork(fileId: string, bucketId: string, relativePath: string) {
  const hashedRelativePath = createHash('ripemd160').update(relativePath).digest('hex');

  return httpService.post<RenameFileInNetworkPayload, { message: string }>('/api/storage/rename-file-in-network', {
    fileId,
    bucketId,
    relativePath: hashedRelativePath,
  });
}

const fileService = {
  updateMetaData,
  deleteFile,
  moveFile,
  fetchRecents,
  renameFileInNetwork,
  uploadFile,
};

export default fileService;