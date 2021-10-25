import { useState, KeyboardEventHandler } from 'react';
import { connect } from 'react-redux';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { RootState } from '../../../store';

import BaseDialog from '../../../core/components/dialogs/BaseDialog/BaseDialog';
import { uiActions } from '../../../store/slices/ui';
import BaseButton from '../../../core/components/Buttons/BaseButton';
import storageThunks from '../../../store/slices/storage/storage.thunks';
import storageSelectors from '../../../store/slices/storage/storage.selectors';
interface CreateFolderDialogProps {
  onFolderCreated?: () => void;
  currentFolderId: number;
}

const CreateFolderDialog = ({ onFolderCreated, currentFolderId }: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state: RootState) => state.ui.isCreateFolderDialogOpen);
  const onClose = (): void => {
    dispatch(uiActions.setIsCreateFolderDialogOpen(false));
  };
  const createFolder = async () => {
    setIsLoading(true);
    await dispatch(storageThunks.createFolderThunk({ folderName, parentFolderId: currentFolderId }))
      .unwrap()
      .then(() => {
        setIsLoading(false);
        onClose();
        onFolderCreated && onFolderCreated();
      })
      .catch((e) => {
        setIsLoading(false);
        return e;
      });
  };
  const onCreateButtonClicked = () => {
    createFolder();
  };
  const onKeyPressed: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      onCreateButtonClicked();
    }
  };

  return (
    <BaseDialog isOpen={isOpen} title="Create folder" onClose={onClose}>
      <div className="w-64 self-center mt-4">
        <input
          autoFocus
          type="text"
          placeholder="Enter folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyPress={onKeyPressed}
          className="w-full py-2 px-2.5"
        />
      </div>

      <div className="flex justify-center items-center bg-l-neutral-20 py-6 mt-6">
        <div className="flex w-64">
          <BaseButton className="cancel w-full mr-4" onClick={onClose}>
            Cancel
          </BaseButton>
          <BaseButton className="w-full primary border" disabled={isLoading} onClick={onCreateButtonClicked}>
            Create
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
  );
};

export default connect((state: RootState) => ({
  user: state.user.user,
  currentFolderId: storageSelectors.currentFolderId(state),
}))(CreateFolderDialog);