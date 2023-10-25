import React, { useEffect, useState } from 'react';

import CircleIcon from '@mui/icons-material/Circle';
import CommitIcon from '@mui/icons-material/Commit';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import { Box, Slider, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

import Cytoscape, { CollectionReturnValue } from 'cytoscape';

import {
  SHOW_EDGES_KEY,
  SHOW_LABELS_KEY,
  SHOW_NODES_KEY,
  SettingsProps,
} from './View';

type Props = {
  cy: Cytoscape.Core | undefined;
  minScore: number;
  maxScore: number;
  minWeight: number;
  maxWeight: number;
  settings: SettingsProps;
  filters: Set<string>;
  matchFullWord: boolean;
  selected: CollectionReturnValue;
};

export default function Sizer({
  cy,
  minScore,
  maxScore,
  minWeight,
  maxWeight,
  settings,
  filters,
  matchFullWord,
  selected,
}: Props) {
  const [nodeSize, setNodeSize] = useState<number>(1);
  const [edgeSize, setEdgeSize] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(1);
  const [numWeightedEdges, setNumWeightedEdges] = useState<number>(0);
  const handleChangeFontSize = (event: Event) => {
    const {
      // @ts-ignore
      target: { value },
    } = event;
    const newFontSize = parseInt(value, 10);
    setFontSize(newFontSize);
  };
  const handleChangeNodeSize = (event: Event) => {
    const {
      // @ts-ignore
      target: { value },
    } = event;
    const newNodeSize = parseInt(value, 10);
    setNodeSize(newNodeSize);
  };
  const handleChangeEdgeSize = (event: Event) => {
    const {
      // @ts-ignore
      target: { value },
    } = event;
    const newEdgeSize = parseInt(value, 10);
    setEdgeSize(newEdgeSize);
  };

  useEffect(() => {
    if (cy) {
      try {
        // node size affects all non-parent nodes
        cy.style()
          .selector('node:childless')
          .style(
            // assuming absolute minScore of 0 and maxScore of 1
            {
              width: `mapData(score, ${minScore || 0}, ${maxScore || 1}, ${
                10 * nodeSize
              }, ${100 * nodeSize})`,
              height: `mapData(score, ${minScore || 0}, ${maxScore || 1}, ${
                10 * nodeSize
              }, ${100 * nodeSize})`,
            },
          )
          .update();

        // font size affects all nodes
        cy.style()
          .selector('node')
          .style(
            // assuming absolute minScore of 0 and maxScore of 1
            {
              'font-size': `mapData(score, ${minScore || 0}, ${
                maxScore || 1
              }, ${1 * fontSize}, ${20 * fontSize})`,
              'text-outline-width': 2 * fontSize,
            },
          )
          .update();

        // fit node sizes to label if labels shown
        if (settings[SHOW_LABELS_KEY]) {
          cy.style()
            .selector('node')
            .style({
              height: 'label',
              width: 'label',
            })
            .update();
        }

        // edge size affects all weighted edges
        // update number of weighted edges
        setNumWeightedEdges(cy.$('edge[weight]').length);

        cy.style()
          .selector('edge[weight]')
          .style(
            // assuming absolute minScore of 0 and maxScore of 1
            {
              // assuming absolute minWeight of 0 and maxWeight of 1
              width: `mapData(weight, ${minWeight || 0}, ${maxWeight || 1}, ${
                1 * edgeSize
              }, ${10 * edgeSize})`,
            },
          )
          .update();
      } catch (e) {
        console.warn(`caught error: ${e}`);
      }
    }
  }, [
    fontSize,
    nodeSize,
    edgeSize,
    cy,
    settings,
    filters,
    matchFullWord,
    selected,
  ]);

  const edgesDisabled = (n: number) => !settings[SHOW_EDGES_KEY] || n === 0;
  const nodesDisabled = !settings[SHOW_NODES_KEY] || settings[SHOW_LABELS_KEY];
  const labelsDisabled = !settings[SHOW_LABELS_KEY];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography>Sizes</Typography>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <FormatSizeIcon
          fontSize="small"
          color={labelsDisabled ? 'disabled' : 'primary'}
        />
        <Slider
          aria-label="Font Size"
          value={fontSize}
          valueLabelDisplay="auto"
          onChange={handleChangeFontSize}
          step={1}
          marks
          min={1}
          max={9}
          disabled={labelsDisabled}
        />
        <FormatSizeIcon
          fontSize="large"
          color={labelsDisabled ? 'disabled' : 'primary'}
        />
      </Stack>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <CircleIcon
          fontSize="small"
          color={!nodesDisabled ? 'primary' : 'disabled'}
        />
        <Slider
          aria-label="Node Size"
          value={nodeSize}
          valueLabelDisplay="auto"
          onChange={handleChangeNodeSize}
          disabled={nodesDisabled}
          step={1}
          marks
          min={1}
          max={9}
        />
        <CircleIcon
          fontSize="large"
          color={!nodesDisabled ? 'primary' : 'disabled'}
        />
      </Stack>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <CommitIcon
          fontSize="small"
          color={edgesDisabled(numWeightedEdges) ? 'disabled' : 'primary'}
        />
        <Slider
          aria-label="Edge Size"
          value={edgeSize}
          valueLabelDisplay="auto"
          onChange={handleChangeEdgeSize}
          step={1}
          marks
          min={1}
          max={9}
          disabled={edgesDisabled(numWeightedEdges)}
        />
        <CommitIcon
          fontSize="large"
          color={edgesDisabled(numWeightedEdges) ? 'disabled' : 'primary'}
        />
      </Stack>
    </Box>
  );
}
