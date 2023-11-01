import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Grid,
  rgbToHex,
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Cytoscape, {
  CollectionReturnValue,
  Core,
  NodeSingular,
} from 'cytoscape';
import avsdf from 'cytoscape-avsdf';
// @ts-ignore
import cise from 'cytoscape-cise';
// @ts-ignore
import cola from 'cytoscape-cola';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import invert from 'invert-color';
import _ from 'lodash';
import randomColor from 'randomcolor';

import Detail from './Detail';
import Export from './Export';
import Filter from './Filter';
import Layout from './Layout';
import Sizer from './Sizer';
import { GraphData } from './data/types';

Cytoscape.use(fcose);
Cytoscape.use(cola);
Cytoscape.use(avsdf);
Cytoscape.use(cise);

// todo: figure out how to uncache for nodes that change color
const selectColor = _.memoize(function (ele: NodeSingular) {
  // parents/categories should not have scores
  if (ele.isParent()) {
    return ele.data('color');
  }

  const score = ele.data('score');

  if (ele.isChild()) {
    const color = randomColor({
      luminosity: 'dark',
      hue: ele.parent().data()['color'],
    });

    // positive scores return same color
    // negative scores return inverted color
    if (score) {
      if (score > 0) {
        return color;
      } else {
        return invert(color);
      }
    }

    return color;
  }

  // orphan: respect color if already present
  if (ele.data('color')) {
    return ele.data('color');
  }

  // if color not present, but has score
  // return black if positive or inverse gray if negative
  const black = '#1f1f1f';
  if (score) {
    if (score > 0) {
      return black;
    } else {
      return invert(black);
    }
  }

  // fall back on black
  return black;
});

const selectTextColor = (ele: NodeSingular) => invert(selectColor(ele));

export const SHOW_NODES_KEY = 'showNodes';
export const SHOW_PARENT_NODES_KEY = 'showParentNodes';
export const SHOW_EDGES_KEY = 'showEdges';
export const SHOW_LABELS_KEY = 'showLabels';

export type SettingsProps = {
  [SHOW_NODES_KEY]: boolean;
  [SHOW_PARENT_NODES_KEY]: boolean;
  [SHOW_EDGES_KEY]: boolean;
  [SHOW_LABELS_KEY]: boolean;
};

type Props = {
  graph: GraphData;
};

const View = ({ graph }: Props) => {
  const [settings, setSettings] = useState({
    [SHOW_NODES_KEY]: true,
    [SHOW_PARENT_NODES_KEY]: true,
    [SHOW_EDGES_KEY]: true,
    [SHOW_LABELS_KEY]: true,
  });

  const scores = graph.nodes.map((node) => Math.abs(node.data.score));
  const weights = graph.edges.map((edge) => Math.abs(edge.data.weight));

  const elements = CytoscapeComponent.normalizeElements({
    nodes: [..._.cloneDeep(graph.nodes), ..._.cloneDeep(graph.parentNodes)],
    edges: _.cloneDeep(graph.edges),
  });

  const [cyHandle, setCyHandle] = useState<Core>();
  const [minScore, setMinScore] = useState<number>(Math.min(...scores));
  const [maxScore, setMaxScore] = useState<number>(Math.max(...scores));
  const [minWeight, setMinWeight] = useState<number>(Math.min(...weights));
  const [maxWeight, setMaxWeight] = useState<number>(Math.max(...weights));
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [matchFullWord, setMatchFullWord] = useState<boolean>(false);
  const [selected, setSelected] = useState<CollectionReturnValue>(
    [] as unknown as CollectionReturnValue,
  );

  const stylesheet = [
    {
      selector: 'node[score][name]',
      style: {
        label: 'data(name)',
        backgroundOpacity: 0,
        backgroundColor: selectColor,
        color: selectTextColor,
        textHalign: 'center',
        textValign: 'center',
        textOutlineColor: selectColor,
        textOutlineOpacity: 0.9,
      },
    },
    {
      // orphan nodes are grey unless they have a color
      selector: 'node:orphan',
      style: {
        textOutlineColor: selectColor,
        textOutlineOpacity: 1,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1,
        opacity: 0.5,
      },
    },
    {
      selector: 'node:parent[color]',
      style: {
        borderColor: 'data(color)',
        backgroundColor: 'data(color)',
        textOutlineColor: 'data(color)',
        textOutlineOpacity: 1,
        backgroundOpacity: 0.75,
        shape: 'roundrectangle',
        textHalign: 'center',
        textValign: 'top',
        compoundSizingWrtLabels: 'include',
      },
    },
    {
      selector: 'node:selected',
      style: {
        textOutlineOpacity: 1,
        textOutlineColor: 'red',
        backgroundColor: 'red',
      },
    },
  ];

  const areNodesHidden = () =>
    !settings[SHOW_PARENT_NODES_KEY] && !settings[SHOW_NODES_KEY];

  const handleCheckbox = (key: keyof typeof settings) => {
    setSettings((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleRemoveFilter = (v: string) => {
    const newSet = new Set(filters);
    newSet.delete(v);
    setFilters(newSet);
  };

  const handleSetMatchFullWord = (): void => {
    setMatchFullWord(!matchFullWord);
  };

  const showElement = (ele: Cytoscape.NodeSingular): void => {
    ele.style({ visibility: 'visible' });

    // if node is a child
    // todo: do not assume just one parent
    const category = ele.parent();
    category.style({ visibility: 'visible' });

    // if node is a parent
    const children = ele.children();
    children.style({ visibility: 'visible' });
  };

  useEffect(() => {
    // anything in here is fired on component mount.
    if (cyHandle) {
      // have to catch this error as it explodes on first load
      try {
        // edges visible
        if (settings[SHOW_EDGES_KEY]) {
          cyHandle.$('edge').selectify();
          cyHandle
            .style()
            .selector('edge')
            .style({
              display: 'element',
            })
            .update();
          // edges not visible
        } else {
          cyHandle.$('edge').unselect().unselectify();
          cyHandle
            .style()
            .selector('edge')
            .style({
              display: 'none',
            })
            .update();
        }

        // parent nodes visible
        if (settings[SHOW_PARENT_NODES_KEY]) {
          cyHandle
            .$('node:parent')
            .selectify()
            .grabify()
            // for some reason ts is not detecting this property
            // @ts-ignore
            .unpanify();
          // without labels
          if (!settings[SHOW_LABELS_KEY]) {
            cyHandle
              .style()
              .selector('node:parent[color]')
              .style({
                'text-outline-opacity': 0,
                'text-opacity': 0,
                'background-opacity': 1,
              })
              .update();
          } else {
            // with labels
            cyHandle
              .style()
              .selector('node:parent[color]')
              .style({
                'background-opacity': 0.75,
                'border-width': 1,
                'text-outline-opacity': 1,
                'text-opacity': 1,
                height: 'label',
                width: 'label',
              })
              .update();
          }
          // parent nodes not visible
        } else {
          cyHandle
            .$('node:parent')
            .unselect()
            .unselectify()
            .ungrabify()
            // for some reason ts is not detecting this property
            // @ts-ignore
            .panify();
          cyHandle
            .style()
            .selector('node:parent[color]')
            .style({
              'background-opacity': 0,
              'border-width': 0,
              'text-outline-opacity': 0,
              'text-opacity': 0,
            })
            .update();
        }

        // note: assuming childless nodes as children
        // show children nodes
        if (settings[SHOW_NODES_KEY]) {
          cyHandle
            .$('node:childless')
            .selectify()
            .grabify()
            // for some reason ts is not detecting this property
            // @ts-ignore
            .unpanify();
          // without labels
          if (!settings[SHOW_LABELS_KEY]) {
            cyHandle
              .style()
              .selector('node:childless')
              .style({
                'text-outline-opacity': 0,
                'text-opacity': 0,
                'background-opacity': 1,
              })
              .update();
          } else {
            // with labels
            cyHandle
              .style()
              .selector('node:childless')
              .style({
                'text-outline-opacity': 1,
                'text-opacity': 1,
              })
              .update();
          }
          // hide children nodes
        } else {
          cyHandle
            .$('node:childless')
            .unselect()
            .unselectify()
            .ungrabify()
            // for some reason ts is not detecting this property
            // @ts-ignore
            .panify();
          cyHandle
            .style()
            .selector('node:childless')
            .style({
              'text-outline-opacity': 0,
              'text-opacity': 0,
            })
            .update();
        }

        // update colors for nodes that are not selected
        cyHandle.nodes(':unselected').forEach((ele) => {
          const color = ele.style('background-color');
          if (color) {
            ele.data({ color: rgbToHex(color) });
          }
        });

        // hide all nodes
        if (filters.size) {
          cyHandle.nodes().style({ visibility: 'hidden' });
        } else {
          cyHandle.nodes().style({ visibility: 'visible' });
          cyHandle.edges().style({ visibility: 'visible' });
        }

        // filter
        filters.forEach((f) => {
          // bring back relevant nodes
          cyHandle.nodes().forEach((ele) => {
            const cleanName = ele.data('name').trim().toLowerCase();
            if (matchFullWord) {
              if (cleanName === f) {
                showElement(ele);
              }
            } else {
              // partial match
              if (cleanName.includes(f)) {
                showElement(ele);
              }
            }
          });
          cyHandle.edges().style({ visibility: 'visible' });
        });

        cyHandle.nodes(':hidden').forEach((ele) => {
          ele.connectedEdges().style({ visibility: 'hidden' });
        });

        const visibleNodes = cyHandle.nodes(':visible:selectable');

        if (visibleNodes.length && cyHandle.container()) {
          cyHandle.fit(visibleNodes);
        }
      } catch (e) {
        console.warn(`caught error: ${e}`);
      }
    }
    return () => {
      // anything in here is fired on component unmount.
    };
  }, [settings, cyHandle, filters, matchFullWord, selected]);

  // keydown listener for deleting elements
  useEffect(() => {
    if (cyHandle) {
      try {
        const deleteElement = (event: KeyboardEvent) => {
          if (event.key === 'Delete' || event.key === 'Backspace') {
            try {
              const elems = cyHandle.$(':selected');
              elems.remove();
            } catch (e) {
              console.warn(`caught error: ${e}`);
            }
          }
        };
        addEventListener('keydown', deleteElement);
        return () => {
          removeEventListener('keydown', deleteElement);
        };
      } catch (e) {
        console.warn(`caught error: ${e}`);
      }
    }
  }, [cyHandle]);

  // keydown listener for deleting elements
  useEffect(() => {
    try {
      if (cyHandle) {
        const updateSelection = () => {
          const elems: CollectionReturnValue = cyHandle.filter(':selected');
          setSelected(elems);
        };

        cyHandle.on('select', '*', updateSelection);
        cyHandle.on('unselect', '*', updateSelection);
        cyHandle.on('remove', '*', updateSelection);
      }
    } catch (e) {
      console.warn(`caught error: ${e}`);
    }
  }, [cyHandle]);

  return (
    <>
      <Box sx={{ my: 1, marginX: 5 }}>
        <Export cy={cyHandle} settings={settings} />
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Filters & Layout</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings[SHOW_NODES_KEY]}
                        onChange={() => handleCheckbox(SHOW_NODES_KEY)}
                      />
                    }
                    label="Show Nodes"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings[SHOW_PARENT_NODES_KEY]}
                        onChange={() => handleCheckbox(SHOW_PARENT_NODES_KEY)}
                      />
                    }
                    label="Show Categories"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={settings[SHOW_EDGES_KEY]}
                        onChange={() => handleCheckbox(SHOW_EDGES_KEY)}
                      />
                    }
                    label="Show Edges"
                  />
                  <FormControlLabel
                    disabled={areNodesHidden()}
                    control={
                      <Checkbox
                        checked={settings[SHOW_LABELS_KEY]}
                        onChange={() => handleCheckbox(SHOW_LABELS_KEY)}
                        indeterminate={areNodesHidden()}
                      />
                    }
                    label="Show Labels"
                  />
                </FormGroup>
              </Grid>
              <Grid item xs={4}>
                <Filter
                  handleSetFilters={setFilters}
                  filters={filters}
                  matchFullWord={matchFullWord}
                  handleSetMatchFullWord={handleSetMatchFullWord}
                />
                <div>
                  {Array.from(filters).map((f) => (
                    <Chip
                      key={f}
                      label={f}
                      onDelete={() => handleRemoveFilter(f)}
                    />
                  ))}
                </div>
              </Grid>
              <Grid item xs={4}>
                <Layout cy={cyHandle} />
                <Sizer
                  cy={cyHandle}
                  minScore={minScore}
                  maxScore={maxScore}
                  minWeight={minWeight}
                  maxWeight={maxWeight}
                  settings={settings}
                  filters={filters}
                  matchFullWord={matchFullWord}
                  selected={selected}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
      <div>
        <CytoscapeComponent
          id="privacy"
          elements={[...elements]}
          stylesheet={stylesheet}
          style={{
            width: 'calc(100vw)',
            height: 'calc(100vh - 400px)',
          }}
          cy={(cy) => {
            // todo: enable reshuffling
            setCyHandle(cy);
          }}
        />
      </div>
      <Detail elements={selected} />
    </>
  );
};
export default View;
