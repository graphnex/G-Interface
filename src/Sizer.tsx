import React, { useEffect, useState } from 'react';

import CircleIcon from '@mui/icons-material/Circle';
import CommitIcon from '@mui/icons-material/Commit';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import { Box, Slider, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

import Cytoscape, {
  CollectionReturnValue,
  EdgeSingular,
  NodeSingular,
} from 'cytoscape';
import _ from 'lodash';

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

const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  return outMin + ((outMax - outMin) * (value - inMin)) / (outMin - inMin);
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

  // todo: figure out how to uncache for resizing
  const selectNodeSize = _.memoize(function (ele: NodeSingular) {
    const score = ele.data('score');
    const minIn = minScore || 0;
    const maxIn = maxScore || 1;
    const MIN_NODE_SIZE_FACTOR = 10;
    const MAX_NODE_SIZE_FACTOR = 100;
    const minOut = MIN_NODE_SIZE_FACTOR * nodeSize;
    const maxOut = MAX_NODE_SIZE_FACTOR * nodeSize;

    if (!score) {
      return minIn;
    }

    const absoluteScore = Math.abs(score);
    return mapRange(absoluteScore, minIn, maxIn, minOut, maxOut);
  });

  // todo: figure out how to uncache for resizing
  const selectFontSize = _.memoize(function (ele: NodeSingular) {
    const score = ele.data('score');
    const minIn = minScore || 0;
    const maxIn = maxScore || 1;
    const MIN_FONT_SIZE_FACTOR = 1;
    const MAX_FONT_SIZE_FACTOR = 20;
    const minOut = MIN_FONT_SIZE_FACTOR * fontSize;
    const maxOut = MAX_FONT_SIZE_FACTOR * fontSize;

    if (!score) {
      return minIn;
    }

    const absoluteScore = Math.abs(score);
    return mapRange(absoluteScore, minIn, maxIn, minOut, maxOut);
  });

  // todo: figure out how to uncache for resizing
  const selectEdgeSize = _.memoize(function (ele: EdgeSingular) {
    const score = ele.data('weight');
    const minIn = minWeight || 0;
    const maxIn = maxWeight || 1;
    const MIN_EDGE_SIZE_FACTOR = 1;
    const MAX_EDGE_SIZE_FACTOR = 10;
    const minOut = MIN_EDGE_SIZE_FACTOR * edgeSize;
    const maxOut = MAX_EDGE_SIZE_FACTOR * edgeSize;

    if (!score) {
      return minIn;
    }

    const absoluteScore = Math.abs(score);
    return mapRange(absoluteScore, minIn, maxIn, minOut, maxOut);
  });

  useEffect(() => {
    if (cy) {
      try {
        // node size affects all non-parent nodes
        cy.style()
          .selector('node:childless')
          .style(
            // assuming absolute minScore of 0 and maxScore of 1
            {
              width: selectNodeSize,
              height: selectNodeSize,
            },
          )
          .update();

        // font size affects all nodes
        cy.style()
          .selector('node')
          .style(
            // assuming absolute minScore of 0 and maxScore of 1
            {
              'font-size': selectFontSize,
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
              width: selectEdgeSize,
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
