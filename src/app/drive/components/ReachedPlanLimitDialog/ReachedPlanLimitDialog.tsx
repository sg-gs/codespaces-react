import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import BaseDialog from '../../../core/components/dialogs/BaseDialog/BaseDialog';
import BaseButton from '../../../core/components/Buttons/BaseButton';
import { setCurrentAccountTab, uiActions } from '../../../store/slices/ui';
import navigationService from '../../../core/services/navigation.service';
import { AccountViewTab } from '../../../core/views/AccountView/tabs';

import './ReachedPlanLimitDialog.scss';
import { AppView } from '../../../core/types';
import i18n from '../../../i18n/services/i18n.service';

const ReachedPlanLimitDialog = (): JSX.Element => {
  const isOpen = useAppSelector((state) => state.ui.isReachedPlanLimitDialogOpen);
  const dispatch = useAppDispatch();

  const onClose = (): void => {
    dispatch(uiActions.setIsReachedPlanLimitDialogOpen(false));
  };

  const onAccept = async (): Promise<void> => {
    try {
      dispatch(setCurrentAccountTab(AccountViewTab.Plans));
      dispatch(uiActions.setIsReachedPlanLimitDialogOpen(false));
      navigationService.push(AppView.Account, { tab: AccountViewTab.Plans });
    } catch (e: unknown) {
      console.log(e);
    }
  };

  return (
    <BaseDialog title="Run out of space" isOpen={isOpen} onClose={onClose}>
      <span className="text-center block w-full text-base px-8 text-neutral-900 my-6">
        {i18n.get('error.noSpaceAvailable')}
      </span>

      <div className="flex justify-center items-center w-full bg-l-neutral-20 py-6">
        <div className="flex w-64 px-8">
          <BaseButton onClick={() => onClose()} className="transparent w-11/12 mr-2">
            {i18n.get('actions.cancel')}
          </BaseButton>
          <BaseButton className="primary w-11/12 ml-2" onClick={() => onAccept()}>
            {i18n.get('actions.upgrade')}
          </BaseButton>
        </div>
      </div>
    </BaseDialog>
  );
};

export default ReachedPlanLimitDialog;