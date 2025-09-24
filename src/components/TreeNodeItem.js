import React, { forwardRef } from 'react';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useTreeItemModel } from '@mui/x-tree-view/hooks';
import TreeNodeContent from './TreeNodeContent';

const TreeNodeItem = forwardRef(function TreeNodeItem(props, ref) {
  const {
    label,
    itemId,
    onInfoClick,
    onPhylopicStatusChange,
    phylopicRefreshEvent,
    ...other
  } = props;
  const itemModel = useTreeItemModel(itemId);
  const nodeData = itemModel?.nodeData;

  return (
    <TreeItem
      {...other}
      ref={ref}
      itemId={itemId}
      label={(
        <TreeNodeContent
          nodeData={nodeData}
          fallbackLabel={typeof label === 'string' ? label : undefined}
          onInfoClick={onInfoClick}
          itemId={itemId}
          onPhylopicStatusChange={onPhylopicStatusChange}
          phylopicRefreshEvent={phylopicRefreshEvent}
        />
      )}
    />
  );
});

export default TreeNodeItem;
