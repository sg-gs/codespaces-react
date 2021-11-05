export interface UserReferral {
  key: string;
  steps: number;
  completedSteps: number;
  isCompleted: boolean;
  credit: number;
  type: ReferralType;
}

export enum ReferralType {
  Storage = 'storage',
}

export enum ReferralKey {
  CreateAccount = 'create-account',
  InstallMobileApp = 'install-mobile-app',
  ShareFile = 'share-file',
  SubscribeToNewsletter = 'subscribe-to-newsletter',
  InstallDesktopApp = 'install-desktop-app',
  InviteFriends = 'invite-friends',
}
