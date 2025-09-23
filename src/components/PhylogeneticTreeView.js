import React, { useState, useMemo, useCallback } from 'react';
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
        root: {
          '& .MuiTreeItem-content': {
            padding: '4px 0',
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
        },
      },
    },
  },
});

const PhylogeneticTreeView = ({ treeData, legendType }) => {
  const [selectedInfoNode, setSelectedInfoNode] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const handleInfoClick = useCallback((nodeData) => {
    setSelectedInfoNode(nodeData);
    setInfoPanelOpen(true);
  }, []);

  // Transform the nested JSON data into the hierarchical format RichTreeView expects
  const transformTreeNode = useCallback((node, parentId = '', index = 0, depth = 0) => {
    if (!node) return null;

    const nodeId = parentId ? `${parentId}-${index}` : 'root';

    // Extract data from arrays (API returns arrays for most fields)
    const nodeData = {
      node_label: node.node_label?.[0] || node.node_label || 'Unknown',
      node_type: node.node_type?.[0] || node.node_type,
      color: node.color?.[0] || node.color,
      has_age: node.has_age?.[0] || node.has_age,
      age_info: node.age_info?.[0] || node.age_info,
      age_numeric: node.age_numeric?.[0] || node.age_numeric,
      node_shape: node.node_shape?.[0] || node.node_shape,
      phylopic_uuid: node.phylopic_uuid?.[0] || node.phylopic_uuid,
      phylopic_url: node.phylopic_url?.[0] || node.phylopic_url,
      phylopic_attribution: node.phylopic_attribution?.[0] || node.phylopic_attribution,
      info_panel: node.info_panel ? {
        image_url: node.info_panel.image_url?.[0] || node.info_panel.image_url,
        image_type: node.info_panel.image_type?.[0] || node.info_panel.image_type,
        image_attribution: node.info_panel.image_attribution?.[0] || node.info_panel.image_attribution,
        wikipedia_text: node.info_panel.wikipedia_text?.[0] || node.info_panel.wikipedia_text,
        wikipedia_url: node.info_panel.wikipedia_url?.[0] || node.info_panel.wikipedia_url,
        wikipedia_title: node.info_panel.wikipedia_title?.[0] || node.info_panel.wikipedia_title,
        geologic_age: node.info_panel.geologic_age?.[0] || node.info_panel.geologic_age,
      } : null,
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
  }, []);

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
          overflow: 'auto',
          padding: 2,
          '& .MuiTreeView-root': {
            minHeight: '100%',
          }
        }}
      >
        <RichTreeView
          items={treeItems}
          defaultExpandedItems={[treeItems[0]?.id]}
          slots={{
            item: TreeNodeItem
          }}
          slotProps={{
            item: {
              onInfoClick: handleInfoClick
            }
          }}
          sx={{
            flexGrow: 1,
            maxWidth: '100%',
            overflowY: 'auto',
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
