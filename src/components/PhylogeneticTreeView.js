import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Box, ThemeProvider, createTheme } from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import TreeNodeItem from './TreeNodeItem';
import InfoPanel from './InfoPanel';

// Create a custom theme for the tree view
const treeTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
  components: {
    MuiTreeItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiTreeItem-content': {
            paddingTop: theme.spacing(0.5),
            paddingBottom: theme.spacing(0.5),
            paddingRight: 0,
            paddingLeft: `calc(${theme.spacing(1)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth))`,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(25, 118, 210, 0.12)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.16)',
              },
            },
          },
          '& .MuiTreeItem-label': {
            padding: 0,
          },
        }),
      },
    },
  },
});

const PhylogeneticTreeView = ({ treeData, legendType, collapseToRootSignal, onExpandedItemsChange }) => {
  const [selectedInfoNode, setSelectedInfoNode] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const animationTimeoutsRef = useRef([]);
  const expandedItemsRef = useRef([]);
  const [phylopicRefreshEvent, setPhylopicRefreshEvent] = useState({ token: 0, targets: [] });
  const phylopicStatusRef = useRef(new Map());
  const secondPassAttemptedRef = useRef(false);
  const expansionAuditTimeoutRef = useRef(null);

  useEffect(() => {
    expandedItemsRef.current = expandedItems;
    // Report expanded items count to parent component
    if (onExpandedItemsChange) {
      onExpandedItemsChange(expandedItems.length);
    }
  }, [expandedItems, onExpandedItemsChange]);

  const handleInfoClick = useCallback((nodeData) => {
    setSelectedInfoNode(nodeData);
    setInfoPanelOpen(true);
  }, []);

  const handlePhylopicStatusChange = useCallback((itemId, status) => {
    if (!itemId) {
      return;
    }

    const registry = phylopicStatusRef.current;

    if (!status) {
      registry.delete(itemId);
      return;
    }

    registry.set(itemId, status);
  }, []);

  const runPhylopicAudit = useCallback(() => {
    const registry = phylopicStatusRef.current;
    if (!registry || registry.size === 0) {
      return;
    }

    const missingItems = [];
    registry.forEach((status, itemId) => {
      if (!status) {
        return;
      }

      const { phylopicUuid, hasSilhouette } = status;
      if (phylopicUuid && !hasSilhouette) {
        missingItems.push(itemId);
      }
    });

    if (missingItems.length > 0) {
      setPhylopicRefreshEvent({ token: Date.now(), targets: missingItems });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (expansionAuditTimeoutRef.current) {
        clearTimeout(expansionAuditTimeoutRef.current);
        expansionAuditTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    phylopicStatusRef.current = new Map();
    secondPassAttemptedRef.current = false;
    if (expansionAuditTimeoutRef.current) {
      clearTimeout(expansionAuditTimeoutRef.current);
      expansionAuditTimeoutRef.current = null;
    }
    setPhylopicRefreshEvent({ token: 0, targets: [] });
  }, [treeData]);

  const normalizeFieldValue = useCallback((value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        const normalizedItem = normalizeFieldValue(item);
        if (normalizedItem !== null && normalizedItem !== undefined && normalizedItem !== '') {
          return normalizedItem;
        }
      }
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const lower = trimmed.toLowerCase();
      if (lower === 'null' || lower === 'undefined') {
        return null;
      }
      return trimmed;
    }

    if (value === null || value === undefined) {
      return null;
    }

    return value;
  }, []);

  // Transform the nested JSON data into the hierarchical format RichTreeView expects
  const transformTreeNode = useCallback((node, parentId = '', index = 0, depth = 0) => {
    if (!node) return null;

    const nodeId = parentId ? `${parentId}-${index}` : 'root';

    const infoPanelDetails = node.info_panel ? {
      image_url: normalizeFieldValue(node.info_panel.image_url),
      image_type: normalizeFieldValue(node.info_panel.image_type),
      image_attribution: normalizeFieldValue(node.info_panel.image_attribution),
      wikipedia_text: normalizeFieldValue(node.info_panel.wikipedia_text),
      wikipedia_url: normalizeFieldValue(node.info_panel.wikipedia_url),
      wikipedia_title: normalizeFieldValue(node.info_panel.wikipedia_title),
      geologic_age: normalizeFieldValue(node.info_panel.geologic_age),
    } : null;

    const infoPanelHasContent = infoPanelDetails && Object.values(infoPanelDetails).some((detail) => {
      if (typeof detail === 'string') {
        return detail.length > 0;
      }
      return detail !== null && detail !== undefined;
    });

    const nodeData = {
      node_label: normalizeFieldValue(node.node_label) || 'Unknown',
      node_type: normalizeFieldValue(node.node_type),
      color: normalizeFieldValue(node.color),
      has_age: normalizeFieldValue(node.has_age),
      age_info: normalizeFieldValue(node.age_info),
      age_numeric: normalizeFieldValue(node.age_numeric),
      node_shape: normalizeFieldValue(node.node_shape),
      phylopic_uuid: normalizeFieldValue(node.phylopic_uuid),
      phylopic_url: normalizeFieldValue(node.phylopic_url),
      phylopic_attribution: normalizeFieldValue(node.phylopic_attribution),
      info_panel: infoPanelHasContent ? infoPanelDetails : null,
      tree_depth: depth
    };

    // Create the tree item for RichTreeView
    // Build child items recursively and filter out nulls if any are returned
    const childItems = Array.isArray(node.children)
      ? node.children
          .map((child, childIndex) => transformTreeNode(child, nodeId, childIndex, depth + 1))
          .filter(Boolean)
      : [];

    return {
      id: nodeId,
      label: nodeData.node_label,
      nodeData,
      children: childItems
    };
  }, [normalizeFieldValue]);

  // Memoize the transformed tree data
  const treeItems = useMemo(() => {
    console.log('PhylogeneticTreeView: Processing tree data:', treeData);
    if (!treeData || !treeData.tree_json) {
      console.log('PhylogeneticTreeView: No tree data available');
      return [];
    }

    const rootItem = transformTreeNode(treeData.tree_json);
    const items = rootItem ? [rootItem] : [];
    console.log('PhylogeneticTreeView: Transformed items:', items);
    return items;
  }, [treeData, transformTreeNode]);

  const expansionSequence = useMemo(() => {
    if (!treeItems || treeItems.length === 0) {
      return [];
    }

    const sequence = [];
    const queue = [...treeItems];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const children = Array.isArray(current.children) ? current.children : [];
      if (children.length > 0) {
        sequence.push(current.id);
        queue.push(...children);
      }
    }

    return sequence;
  }, [treeItems]);

  const clearAnimationTimeouts = useCallback(() => {
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
  }, []);

  const stopAnimation = useCallback(() => {
    clearAnimationTimeouts();
  }, [clearAnimationTimeouts]);

  // Gradually expand ancestor nodes so the mobile tree appears to "grow" level by level
  useEffect(() => {
    clearAnimationTimeouts();

    if (!expansionSequence.length) {
      setExpandedItems([]);
      return undefined;
    }

    const INITIAL_DELAY_MS = 800;
    const EXPANSION_DELAY_MS = 1200;

    setExpandedItems([]);

    const timeoutIds = expansionSequence.map((itemId, index) => {
      return setTimeout(() => {
        setExpandedItems((prevExpanded) => {
          if (prevExpanded.includes(itemId)) {
            return prevExpanded;
          }
          return [...prevExpanded, itemId];
        });
      }, INITIAL_DELAY_MS + index * EXPANSION_DELAY_MS);
    });

    animationTimeoutsRef.current = timeoutIds;

    return () => {
      clearAnimationTimeouts();
    };
  }, [expansionSequence, clearAnimationTimeouts]);

  useEffect(() => {
    if (!expansionSequence.length) {
      return;
    }

    const uniqueExpansionIds = Array.from(new Set(expansionSequence));
    if (!uniqueExpansionIds.length) {
      return;
    }

    const expandedSet = new Set(expandedItems);
    const allExpanded = uniqueExpansionIds.every((id) => expandedSet.has(id));

    if (allExpanded && !secondPassAttemptedRef.current) {
      secondPassAttemptedRef.current = true;
      if (expansionAuditTimeoutRef.current) {
        clearTimeout(expansionAuditTimeoutRef.current);
      }
      expansionAuditTimeoutRef.current = setTimeout(() => {
        runPhylopicAudit();
      }, 600);
    }
  }, [expandedItems, expansionSequence, runPhylopicAudit]);

  // Collapse expanded ancestors one-by-one so the tree "shrinks" back to the common ancestor
  useEffect(() => {
    if (!collapseToRootSignal) {
      return undefined;
    }

    if (!expandedItemsRef.current.length) {
      return undefined;
    }

    clearAnimationTimeouts();

    const COLLAPSE_DELAY_MS = 600;
    const collapseOrder = [...expandedItemsRef.current].reverse();

    const timeoutIds = collapseOrder.map((itemId, index) => {
      return setTimeout(() => {
        setExpandedItems((prevExpanded) => prevExpanded.filter((id) => id !== itemId));
      }, index * COLLAPSE_DELAY_MS);
    });

    animationTimeoutsRef.current = timeoutIds;

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [collapseToRootSignal, clearAnimationTimeouts]);

  const handleExpandedItemsChange = useCallback((event, itemIds) => {
    stopAnimation();
    if (Array.isArray(itemIds)) {
      setExpandedItems(itemIds);
    }
  }, [stopAnimation]);

  const handleInfoPanelClose = () => {
    setInfoPanelOpen(false);
    setSelectedInfoNode(null);
  };

  if (!treeItems || treeItems.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: 'text.secondary'
        }}
      >
        No tree data available
      </Box>
    );
  }

  return (
    <ThemeProvider theme={treeTheme}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 2,
          paddingBottom: 4,
          '& .MuiTreeView-root': {
            minHeight: '100%',
          }
        }}
      >
        <RichTreeView
          items={treeItems}
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
          itemChildrenIndentation={24}
          slots={{
            item: TreeNodeItem
          }}
          slotProps={{
            item: {
              onInfoClick: handleInfoClick,
              onPhylopicStatusChange: handlePhylopicStatusChange,
              phylopicRefreshEvent
            }
          }}
          sx={{
            flexGrow: 1,
            maxWidth: '100%',
            minHeight: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        />

        <InfoPanel
          open={infoPanelOpen}
          onClose={handleInfoPanelClose}
          nodeData={selectedInfoNode}
        />
      </Box>
    </ThemeProvider>
  );
};

export default PhylogeneticTreeView;
