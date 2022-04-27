/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { match } from 'react-router';
import 'react-toastify/dist/ReactToastify.css';
import { aes } from '@internxt/lib';
import { ReactComponent as Logo } from 'assets/icons/brand/x-white.svg';
import { getSharedFileInfo } from 'app/share/services/share.service';
import iconService from 'app/drive/services/icon.service';
import sizeService from 'app/drive/services/size.service';
import { TaskProgress } from 'app/tasks/types';
import { Network } from 'app/drive/services/network.service';
import i18n from 'app/i18n/services/i18n.service';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks';
import { userThunks } from '../../../../app/store/slices/user';
import desktopService from '../../../../app/core/services/desktop.service';
import FileViewer from '../../../../app/drive/components/FileViewer/FileViewer';
import fileExtensionService from '../../../drive/services/file-extension.service';
import { fileExtensionPreviewableGroups } from '../../../drive/types/file-types';

import bg from 'assets/images/shared-file/bg.png';
import Shield from 'assets/images/shared-file/icons/shield.png';
import EndToEnd from 'assets/images/shared-file/icons/end-to-end.png';
import Lock from 'assets/images/shared-file/icons/lock.png';
import EyeSlash from 'assets/images/shared-file/icons/eye-slash.png';
import UilCheck from '@iconscout/react-unicons/icons/uil-check';
import UilEye from '@iconscout/react-unicons/icons/uil-eye';
import UilArrowRight from '@iconscout/react-unicons/icons/uil-arrow-right';
import UilImport from '@iconscout/react-unicons/icons/uil-import';

import './ShareView.scss';
import downloadService from 'app/drive/services/download.service';
import errorService from 'app/core/services/error.service';
import { ShareTypes } from '@internxt/sdk/dist/drive';
import { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';

export interface ShareViewProps extends ShareViewState {
  match: match<{
    token: string;
    code: string;
  }>;
}

interface GetShareInfoWithDecryptedName extends ShareTypes.SharedFileInfo {
  name: string | null;
}

interface ShareViewState {
  token: string;
  progress: number;
  isDownloading: boolean;
  info: GetShareInfoWithDecryptedName | null;
  error: Error | null;
  accessedFile: boolean;
  openPreview: boolean;
  isAuthenticated: boolean;
  user: UserSettings | null;
}

const ShareFileView = (props: ShareViewProps): JSX.Element => {
  const token = props.match.params.token;
  const code = props.match.params.code;
  const [progress, setProgress] = useState(TaskProgress.Min);
  const [isDownloading, setIsDownloading] = useState(false);
  const [info, setInfo] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMSG, setErrorMSG] = useState(Error);
  const [openPreview, setOpenPreview] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const user = useAppSelector((state) => state.user.user);
  let body;

  useEffect(() => {
    const getInfo = async () => {
      await loadInfo();
    };
    getInfo();
  }, []);

  const Spinner = (
    <>
      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824
              3 7.938l3-2.647z"
        ></path>
      </svg>
    </>
  );

  const getAvatarLetters = () => {
    const initials = user && `${user['name'].charAt(0)}${user['lastname'].charAt(0)}`.toUpperCase();
    return initials;
  };

  const closePreview = () => {
    setOpenPreview(false);
  };

  const isTypeAllowed = () => {
    const extensionsList = fileExtensionService.computeExtensionsLists(fileExtensionPreviewableGroups);
    const extensionsWithFileViewer = Object.entries(extensionsList)
      .map((arr) => arr[1])
      .filter((arr) => arr.length > 0);
    for (const extensions of extensionsWithFileViewer) {
      if (extensions.includes(info['fileMeta']['type'] || '')) {
        return true;
      }
    }
  };

  const getDecryptedName = (info: ShareTypes.SharedFileInfo): string => {
    const salt = `${process.env.REACT_APP_CRYPTO_SECRET2}-${info.fileMeta.folderId.toString()}`;
    const decryptedFilename = aes.decrypt(info.fileMeta.name, salt);

    return decryptedFilename;
  };

  const getFormatFileName = (): string => {
    const hasType = info['fileMeta']['type'] !== null;
    const extension = hasType ? `.${info['fileMeta']['type']}` : '';
    return `${info['fileMeta']['name']}${extension}`;
  };

  const getFormatFileSize = (): string => {
    return sizeService.bytesToString(info['fileMeta']['size']);
  };

  const downloadDesktopApp = () => {
    window.open(desktopService.getDownloadAppUrl(), '_self');
  };

  const dispatch = useAppDispatch();
  const logout = () => {
    dispatch(userThunks.logoutThunk());
  };

  const loadInfo = async () => {
    // ! iOS Chrome is not supported
    if (navigator.userAgent.match('CriOS')) {
      setIsError(true);
      setErrorMSG(new Error('Chrome iOS not supported. Use Safari to proceed'));
    }

    try {
      const info = await getSharedFileInfo(token).catch(() => {
        setIsError(true);
        throw new Error(i18n.get('error.linkExpired'));
      });

      setInfo({
        ...info,
        name: getDecryptedName(info),
      });

      setIsLoaded(true);

      const updatedName = { ...info };
      if (updatedName.fileMeta) {
        updatedName.fileMeta.name = getDecryptedName(info);
      }
      setInfo({ ...updatedName });
    } catch (err) {
      setIsError(true);
      setErrorMSG(errorService.castError(err));
    }
  };

  function getEncryptionKey() {
    const fileInfo = info as unknown as ShareTypes.SharedFileInfo;
    let encryptionKey;
    if (code) {
      encryptionKey = aes.decrypt(fileInfo.encryptionKey, code);
    } else {
      encryptionKey = fileInfo.encryptionKey;
    }

    return encryptionKey;
  }

  function getBlob() {
    const fileInfo = info as unknown as ShareTypes.SharedFileInfo;
    const network = new Network('NONE', 'NONE', 'NONE');

    const encryptionKey = getEncryptionKey();

    return network.downloadFile(fileInfo.bucket, fileInfo.file, {
      fileEncryptionKey: Buffer.from(encryptionKey, 'hex'),
      fileToken: fileInfo.fileToken,
      progressCallback: (progress) => {
        console.log(`Preview download progress ${progress}`);
      },
    });
  }

  function onDownloadFromPreview() {
    setOpenPreview(false);
    download();
  }

  const download = async (): Promise<void> => {
    if (!isDownloading) {
      const fileInfo = info as unknown as ShareTypes.SharedFileInfo | null;
      const MIN_PROGRESS = 0;

      if (fileInfo) {
        const network = new Network('NONE', 'NONE', 'NONE');

        const encryptionKey = getEncryptionKey();

        setProgress(MIN_PROGRESS);
        setIsDownloading(true);
        const [fileBlobPromise] = network.downloadFile(fileInfo.bucket, fileInfo.file, {
          fileEncryptionKey: Buffer.from(encryptionKey, 'hex'),
          fileToken: fileInfo.fileToken,
          progressCallback: (progress) => {
            setProgress(Math.max(MIN_PROGRESS, Math.round(progress * 100 * 1e2) / 1e2));
          },
        });
        const fileBlob = await fileBlobPromise;

        downloadService.downloadFileFromBlob(fileBlob, getFormatFileName());
      }
    }
  };

  const handleLeavePage = (e) => {
    const confirmationMessage = '';

    e.returnValue = confirmationMessage; //Trident, Chrome 34+
    return confirmationMessage; // WebKit, Chrome <34
  };

  useEffect(() => {
    if (isDownloading && progress < 100) {
      window.addEventListener('beforeunload', handleLeavePage);

      return () => window.removeEventListener('beforeunload', handleLeavePage);
    }
  }, [progress]);

  if (isError) {
    console.log(errorMSG.message);
    const ItemIconComponent = iconService.getItemIcon(false, 'default');

    body = (
      <>
        <div className="relative h-32 w-32">
          <ItemIconComponent className="absolute -top-2.5 left-7 rotate-10 transform drop-shadow-soft filter" />
          <ItemIconComponent className="absolute top-0.5 -left-7 rotate-10- transform drop-shadow-soft filter" />
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">Shared files no longer available</span>
          <span className="text-cool-gray-60">Link expired or files deleted</span>
        </div>

        {isAuthenticated && (
          <Link to="/app" className="cursor-pointer text-cool-gray-90 no-underline hover:text-cool-gray-90">
            <div
              className="flex h-10 flex-row items-center justify-center space-x-2 rounded-lg bg-cool-gray-10
                          px-6 font-medium"
            >
              <span>Open Internxt Drive</span>
              <UilArrowRight height="20" width="20" />
            </div>
          </Link>
        )}
      </>
    );
  } else if (isLoaded) {
    const FileIcon = iconService.getItemIcon(false, info['fileMeta']['type']);

    body = (
      <>
        {/* File info */}
        <div className="flex flex-grow-0 flex-col items-center justify-center space-y-4">
          <div className="h-32 w-32 drop-shadow-soft filter">
            <FileIcon />
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex flex-col items-center justify-center text-center font-medium">
              <abbr className="w-screen max-w-prose break-words px-10 text-xl sm:w-full" title={getFormatFileName()}>
                {getFormatFileName()}
              </abbr>
              <span className="text-cool-gray-60">{getFormatFileSize()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row items-center justify-center space-x-3">
          {isTypeAllowed() && (
            <button
              onClick={() => {
                setOpenPreview(true);
              }}
              className="flex h-10 cursor-pointer flex-row items-center space-x-2 rounded-lg bg-blue-10 px-6
                        font-medium text-blue-60 active:bg-blue-20 active:bg-opacity-65"
            >
              <UilEye height="20" width="20" />
              <span>{i18n.get('actions.view')}</span>
            </button>
          )}

          <button
            onClick={download}
            className={`flex h-10 cursor-pointer flex-row items-center space-x-2 rounded-lg px-6 font-medium
                        text-white ${progress && !(progress < 100) ? 'bg-green-40' : 'bg-blue-60'}`}
          >
            {isDownloading ? (
              progress < 100 ? (
                <>
                  {/* Download in progress */}
                  <div className="mr-1 h-5 w-5 text-white">{Spinner}</div>
                  <span>{i18n.get('actions.downloading')}</span>
                  <span className="font-normal text-blue-20">{progress}%</span>
                </>
              ) : (
                <>
                  {/* Download completed */}
                  <UilCheck height="24" width="24" />
                  <span className="font-medium">{i18n.get('actions.downloaded')}</span>
                </>
              )
            ) : (
              <>
                {/* Download button */}
                <UilImport height="20" width="20" />
                <span className="font-medium">{i18n.get('actions.download')}</span>
              </>
            )}
          </button>
        </div>
      </>
    );
  } else {
    body = <div className="h-8 w-8 text-cool-gray-30">{Spinner}</div>;
  }

  return (
    <>
      <FileViewer
        show={openPreview}
        file={info['fileMeta']}
        onClose={closePreview}
        onDownload={onDownloadFromPreview}
        downloader={getBlob}
      />

      {/* Content */}
      <div className="flex h-screen flex-row items-stretch justify-center bg-white text-cool-gray-90">
        {/* Banner */}
        <div className="relative hidden h-full w-96 flex-shrink-0 flex-col bg-blue-80 text-white lg:flex">
          <img src={bg} className="absolute top-0 left-0 h-full w-full object-cover object-center" />

          <div className="z-10 flex h-full flex-col space-y-12 p-12">
            <div className="relative flex flex-row items-center space-x-2 font-semibold">
              <Logo className="h-4 w-4" />
              <span>INTERNXT</span>
            </div>

            <div className="flex h-full flex-col justify-center space-y-20">
              <div className="flex flex-col space-y-2">
                <span className="text-xl opacity-60">WE ARE INTERNXT</span>
                <p className="text-5xl-banner font-semibold leading-none">Private and secure cloud storage</p>
              </div>

              <div className="flex flex-col space-y-3 text-xl">
                {[
                  { icon: Shield, label: 'Privacy by design' },
                  { icon: EndToEnd, label: 'End-to-end encryption' },
                  { icon: Lock, label: 'Military-grade encryption' },
                  { icon: EyeSlash, label: 'Zero-knowledge technology' },
                ].map((item) => (
                  <div className="flex flex-row items-center space-x-3" key={item.icon}>
                    <img src={item.icon} className="h-6 w-6" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {!isAuthenticated && (
              <Link to="/new" className="no-underline">
                <div
                  className="flex cursor-pointer flex-row items-center justify-center rounded-xl p-1 no-underline
                                ring-3 ring-blue-30"
                >
                  <div
                    className="flex h-12 w-full flex-row items-center justify-center rounded-lg bg-white
                                  px-6 text-xl font-semibold text-blue-70 no-underline"
                  >
                    <span>Get 10GB for FREE</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Download container */}
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <div className="flex h-20 flex-shrink-0 flex-row items-center justify-end px-6">
            {isAuthenticated ? (
              <>
                {/* User avatar */}
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button
                      className="focus:outline-none inline-flex w-full justify-center rounded-lg px-4
                                              py-2 font-medium focus-visible:ring-2
                                              focus-visible:ring-blue-20 focus-visible:ring-opacity-75"
                    >
                      <div className="flex flex-row space-x-3">
                        <div
                          className="flex h-8 w-8 flex-row items-center justify-center
                                        rounded-full bg-blue-10 text-blue-80"
                        >
                          <span className="text-sm font-semibold">{getAvatarLetters()}</span>
                        </div>
                        <div className="flex flex-row items-center font-semibold">
                          <span>{`${user && user['name']} ${user && user['lastname']}`}</span>
                        </div>
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items
                      className="focus:outline-none absolute right-0 origin-top-right whitespace-nowrap rounded-md bg-white
                                            p-1 shadow-lg ring-1 ring-cool-gray-100 ring-opacity-5
                                            "
                    >
                      <Menu.Item>
                        {({ active }) => (
                          <Link to="/app" className="text-cool-gray-90 no-underline hover:text-cool-gray-90">
                            <button
                              className={`${active && 'bg-cool-gray-5'} group flex w-full items-center rounded-md
                                            px-4 py-2 font-medium`}
                            >
                              Go to Internxt Drive
                            </button>
                          </Link>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              downloadDesktopApp();
                            }}
                            className={`${active && 'bg-cool-gray-5'} group flex w-full items-center rounded-md
                                            px-4 py-2 font-medium`}
                          >
                            Download Desktop App
                          </button>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              logout();
                            }}
                            className={`${active && 'bg-red-10 bg-opacity-50 text-red-60'} group flex w-full
                                            items-center rounded-md px-4 py-2 font-medium`}
                          >
                            Log out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <>
                {/* Login / Create account */}
                <div className="flex flex-row space-x-3">
                  <Link to="/login" className="no-underline">
                    <div
                      className="flex h-9 cursor-pointer flex-row items-center justify-center rounded-lg px-4
                                    font-medium text-cool-gray-90 no-underline hover:text-cool-gray-90"
                    >
                      Login
                    </div>
                  </Link>

                  <Link to="/new" className="no-underline">
                    <div
                      className="flex h-9 cursor-pointer flex-row items-center justify-center rounded-lg bg-cool-gray-10
                                    px-4 font-medium text-cool-gray-90 no-underline
                                    hover:text-cool-gray-90"
                    >
                      Create account
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* File container */}
          <div className="mb-20 flex h-full flex-col items-center justify-center space-y-10">{body}</div>
        </div>
      </div>
    </>
  );
};
export default ShareFileView;