import { Transition } from '@headlessui/react';

export default function Dialog({
  isOpen,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  primaryActionColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  primaryActionColor: 'primary' | 'danger';
}): JSX.Element {
  return (
    <Transition show={isOpen}>
      <Transition.Child
        enter="ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      ></Transition.Child>
      <Transition.Child
        enter="ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        className="absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white p-3 text-center"
      >
        <h1 className="mt-4 text-xl font-semibold text-gray-80">{title}</h1>
        <p className="font-medium text-gray-50">{subtitle}</p>
        <div className="mt-6 flex h-10 space-x-2">
          <button
            onClick={onSecondaryAction}
            className="flex-1 rounded-lg bg-gray-5 font-medium text-gray-80 active:bg-gray-10"
          >
            {secondaryAction}
          </button>
          <button
            onClick={onPrimaryAction}
            className={`flex-1 rounded-lg  font-medium text-white  ${
              primaryActionColor === 'primary' ? 'bg-primary active:bg-primary-dark' : 'bg-red-60 active:bg-red-70'
            }`}
          >
            {primaryAction}
          </button>
        </div>
      </Transition.Child>
    </Transition>
  );
}