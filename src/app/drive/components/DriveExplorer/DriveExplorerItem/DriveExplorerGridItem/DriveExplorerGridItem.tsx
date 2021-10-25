import { Fragment, createRef, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import * as Unicons from '@iconscout/react-unicons';
import { items } from '@internxt/lib';

import DriveItemDropdownActions from '../../../DriveItemDropdownActions/DriveItemDropdownActions';
import iconService from '../../../../services/icon.service';
import useForceUpdate from '../../../../../core/hooks/useForceUpdate';
import { DriveItemAction, DriveExplorerItemProps } from '..';
import useDriveItemActions from '../hooks/useDriveItemActions';
import useDriveItemStoreProps from '../hooks/useDriveStoreProps';
import { useDriveItemDrag, useDriveItemDrop } from '../hooks/useDriveItemDragAndDrop';

import './DriveExplorerGridItem.scss';

const DriveExplorerGridItem = (props: DriveExplorerItemProps) => {
  const [itemRef] = useState(createRef<HTMLDivElement>());
  const { item } = props;
  const { isItemSelected } = useDriveItemStoreProps();
  const {
    isEditingName,
    dirtyName,
    nameInputRef,
    onNameChanged,
    onNameBlurred,
    onNameClicked,
    onNameEnterKeyPressed,
    onDownloadButtonClicked,
    onRenameButtonClicked,
    onInfoButtonClicked,
    onDeleteButtonClicked,
    onShareButtonClicked,
    onItemClicked,
    onItemRightClicked,
    onItemDoubleClicked,
  } = useDriveItemActions(item);
  const { connectDragSource, isDraggingThisItem } = useDriveItemDrag(item);
  const { connectDropTarget, isDraggingOverThisItem } = useDriveItemDrop(item);
  const forceUpdate = useForceUpdate();
  const updateHeight = () => forceUpdate();
  const nameNodeFactory = () => {
    const ṣpanDisplayClass: string = !isEditingName ? 'block' : 'hidden';

    return (
      <Fragment>
        <div className={isEditingName ? 'flex' : 'hidden'}>
          <input
            className="w-full dense border border-white no-ring rect select-text"
            onClick={(e) => e.stopPropagation()}
            ref={nameInputRef}
            type="text"
            value={dirtyName}
            placeholder="Name"
            onChange={onNameChanged}
            onBlur={onNameBlurred}
            onKeyPress={onNameEnterKeyPressed}
            autoFocus
          />
          <span className="ml-1">{item.type ? '.' + item.type : ''}</span>
        </div>
        <span
          data-test={`${item.isFolder ? 'folder' : 'file'}-name`}
          className={`${ṣpanDisplayClass} cursor-pointer file-grid-item-name-span`}
          onClick={onNameClicked}
        >
          {items.getItemDisplayName(item)}
        </span>
      </Fragment>
    );
  };
  const isDraggingClassNames: string = isDraggingThisItem ? 'is-dragging' : '';
  const isDraggingOverClassNames: string = isDraggingOverThisItem ? 'drag-over-effect' : '';
  const selectedClassNames: string = isItemSelected(item) ? 'selected' : '';
  const ItemIconComponent = iconService.getItemIcon(item.isFolder, item.type);
  const height = itemRef.current ? itemRef.current?.clientWidth + 'px' : 'auto';

  useEffect(() => {
    updateHeight();

    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const template = connectDropTarget(
    <div
      ref={itemRef}
      style={{ height }}
      className={`${selectedClassNames} ${isDraggingOverClassNames} ${isDraggingClassNames} group file-grid-item`}
      onContextMenu={onItemRightClicked}
      onClick={onItemClicked}
      onDoubleClick={onItemDoubleClicked}
      draggable={false}
    >
      <Dropdown>
        <Dropdown.Toggle variant="success" id="dropdown-basic" className="file-grid-item-actions-button">
          <Unicons.UilEllipsisH className="w-full h-full" />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <DriveItemDropdownActions
            hiddenActions={item.isFolder ? [DriveItemAction.Download, DriveItemAction.Share] : []}
            onRenameButtonClicked={onRenameButtonClicked}
            onDownloadButtonClicked={onDownloadButtonClicked}
            onShareButtonClicked={onShareButtonClicked}
            onInfoButtonClicked={onInfoButtonClicked}
            onDeleteButtonClicked={onDeleteButtonClicked}
          />
        </Dropdown.Menu>
      </Dropdown>
      <div className="file-grid-item-icon-container">
        <ItemIconComponent className="file-icon m-auto" />
      </div>
      <div className="text-center mt-3">
        <div className="mb-1">{nameNodeFactory()}</div>
      </div>
    </div>,
  );

  return isEditingName ? template : connectDragSource(template);
};

export default DriveExplorerGridItem;