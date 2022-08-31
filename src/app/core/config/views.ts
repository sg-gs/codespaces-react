import { ComponentClass, FunctionComponent } from 'react';

import SignUpView from 'app/auth/views/SignUpView/SignUpView';
import SignInView from 'app/auth/views/SignInView/SignInView';
import SignUpWebsiteView from 'app/auth/views/SignUpWebsiteView/SignUpWebsiteView';
import DriveView from 'app/drive/views/DriveView/DriveView';
import RecentsView from 'app/drive/views/RecentsView/RecentsView';
import NotFoundView from '../views/NotFoundView/NotFoundView';
import AccountView from 'app/core/views/AccountView/AccountView';
import Preferences from 'app/core/views/Preferences';
import DeactivationView from 'app/core/views/DeactivationView/DeactivationView';
import JoinTeamView from 'app/teams/views/JoinTeamView/JoinTeamView';
import TeamSuccessView from 'app/teams/views/TeamSuccessView/TeamSuccessView';
import DeactivationTeamsView from 'app/teams/views/DeactivationTeamsView/DeactivationTeamsView';
import ShareFileView from 'app/share/views/ShareView/ShareFileView';
import RemoveAccountView from 'app/auth/views/RemoveAccountView/RemoveAccountView';
import GuestAcceptInvitationView from 'app/guests/views/GuestAcceptInviteView/GuestAcceptInviteView';
import CheckoutView from 'app/payment/views/CheckoutView/CheckoutView';
import BackupsView from 'app/backups/views/BackupsView/BackupsView';

import { AppView } from '../types';
import CheckoutSuccessView from 'app/payment/views/CheckoutSuccessView/CheckoutSuccessView';
import RecoverView from '../../auth/views/RecoverView/RecoverView';
import ShareFolderView from '../../share/views/ShareView/ShareFolderView';
import SharePhotosView from '../../share/views/ShareView/SharePhotosView';
import RedirectToAppView from '../../core/views/RedirectToAppView/RedirectToAppView';
import PhotosView from '../../photos/views/PhotosView';
import VerifyEmailView from '../views/VerifyEmailView';

const views: Array<{
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: FunctionComponent<any> | ComponentClass<any>;
  componentProps?: Record<string, unknown>;
}> = [
  { id: AppView.Signup, component: SignUpView, componentProps: { isNewUser: true } },
  { id: AppView.SignupDialog, component: SignUpView, componentProps: { displayIframe: true, isNewUser: true } },
  { id: AppView.AppSumo, component: SignUpView, componentProps: { isNewUser: false } },
  { id: AppView.Login, component: SignInView },
  { id: AppView.LoginDialog, component: SignInView, componentProps: { displayIframe: true } },
  { id: AppView.SignUpWebsite, component: SignUpWebsiteView, componentProps: { isNewUser: true } },
  { id: AppView.Recover, component: RecoverView },
  { id: AppView.Drive, component: DriveView },
  { id: AppView.Recents, component: RecentsView },
  { id: AppView.Backups, component: BackupsView },
  { id: AppView.Photos, component: PhotosView },
  { id: AppView.Account, component: AccountView },
  { id: AppView.Preferences, component: Preferences },
  { id: AppView.TeamsJoin, component: JoinTeamView },
  { id: AppView.GuestAcceptInvite, component: GuestAcceptInvitationView },
  { id: AppView.Deactivation, component: DeactivationView },
  { id: AppView.TeamsDeactivation, component: DeactivationTeamsView },
  { id: AppView.TeamSuccess, component: TeamSuccessView },
  { id: AppView.CheckoutSuccess, component: CheckoutSuccessView },
  { id: AppView.Checkout, component: CheckoutView },
  { id: AppView.Remove, component: RemoveAccountView },
  { id: AppView.RemoveDialog, component: RemoveAccountView, componentProps: { displayIframe: true } },
  { id: AppView.ShareFileToken, component: ShareFileView },
  { id: AppView.ShareFolderToken, component: ShareFolderView },
  { id: AppView.SharePhotosToken, component: SharePhotosView },
  { id: AppView.RedirectToApp, component: RedirectToAppView },
  { id: AppView.VerifyEmail, component: VerifyEmailView },
  { id: AppView.NotFound, component: NotFoundView },
];

export default views;
