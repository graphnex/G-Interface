import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import Cytoscape, { Core, ElementDefinition, NodeSingular } from 'cytoscape';
// @ts-ignore
import avsdf from 'cytoscape-avsdf';
// @ts-ignore
import cise from 'cytoscape-cise';
// @ts-ignore
import cola from 'cytoscape-cola';
// @ts-ignore
import compoundDragAndDrop from 'cytoscape-compound-drag-and-drop';
// @ts-ignore
import edgehandles from 'cytoscape-edgehandles';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import _ from 'lodash';
import randomColor from 'randomcolor';
import rgbHex from 'rgb-hex';

import { ExplanationData } from './WordCloud';
import CheckBoxSetting from './components/CheckBoxSetting';
import ExplanationDataImporter from './components/ExplanationDataImporter';
import SettingsWrapper from './components/SettingsWrapper';
import UseCase from './components/UseCase';
import { defaultWords1 } from './data';
import genomicsGraphData from './data/genomicsGraph';
import genomicsGraph from './data/genomicsGraph';
import privacyGraphData from './data/privacyGraph';
import privacyGraph from './data/privacyGraph';
import { GraphData } from './data/types';

Cytoscape.use(fcose);
Cytoscape.use(cola);
Cytoscape.use(avsdf);
Cytoscape.use(cise);
Cytoscape.use(compoundDragAndDrop);
Cytoscape.use(edgehandles);

// todo: figure out how to uncache for nodes that change color
const selectTextOutlineColor = _.memoize(function (ele: NodeSingular) {
  if (ele.isParent()) {
    return ele.data()['color'];
  }

  if (ele.isChild()) {
    return randomColor({
      luminosity: 'dark',
      hue: ele.parent().data()['color'],
    });
  }

  return 'gray';
});

const convertToString = (obj?: any): string => {
  return JSON.stringify(obj, null, 2);
};

const convertFromString = (obj?: any): any => {
  return JSON.parse(obj);
};

const SHOW_NODES_KEY = 'showNodes';
const SHOW_PARENT_NODES_KEY = 'showParentNodes';
const SHOW_EDGES_KEY = 'showEdges';

const graph = genomicsGraph;
// const graph = privacyGraph;

const scores = graph.nodes.map((node) => node.data.score);
const weights = graph.edges.map((edge) => edge.data.weight);

const elements = CytoscapeComponent.normalizeElements({
  nodes: [..._.cloneDeep(graph.nodes), ..._.cloneDeep(graph.parentNodes)],
  edges: _.cloneDeep(graph.edges),
});

const App = () => {
  const [settings, setSettings] = useState({
    [SHOW_NODES_KEY]: true,
    [SHOW_PARENT_NODES_KEY]: true,
    [SHOW_EDGES_KEY]: true,
  });

  const [useCase, setUseCase] = useState('genomics');
  const [cyHandle, setCyHandle] = useState<Core>();
  const [minScore, setMinScore] = useState<Number>(Math.min(...scores));
  const [maxScore, setMaxScore] = useState<Number>(Math.max(...scores));
  const [minWeight, setMinWeight] = useState<Number>(Math.min(...weights));
  const [maxWeight, setMaxWeight] = useState<Number>(Math.max(...weights));

  const layout = { name: 'fcose' };
  // const layout = { name: 'cola' };
  // const layout = { name: 'random' };
  // const layout = { name: 'cose' };
  // const layout = { name: 'circle' };
  // const layout = { name: 'concentric' };
  // const layout = { name: 'grid' };
  // const layout = { name: 'avsdf' };
  // const layout = { name: 'cise' };

  const stylesheet = [
    {
      selector: 'node[score][name]',
      style: {
        label: 'data(name)',
        backgroundOpacity: 0,
        fontSize: `mapData(score, ${minScore}, ${maxScore}, 1, 20)`,
        color: 'white',
        textHalign: 'center',
        textValign: 'center',
        // textOutlineColor: `mapData(score, ${minScore}, ${maxScore}, blue, red)`,
        textOutlineColor: selectTextOutlineColor,
        textOutlineOpacity: 0.9,
        textOutlineWidth: 5,
      },
    },
    {
      selector: 'node:orphan',
      style: {
        textOutlineColor: 'gray',
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
      selector: 'edge[weight]',
      style: {
        width: `mapData(weight, ${minWeight}, ${maxWeight}, 1, 10)`,
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
      },
    },
  ];

  const handleCheckbox = (key: keyof typeof settings) => {
    setSettings((p) => ({ ...p, [key]: !p[key] }));
  };

  useEffect(() => {
    // anything in here is fired on component mount.
    if (cyHandle) {
      // edges
      if (settings[SHOW_EDGES_KEY]) {
        cyHandle
          .style()
          .selector('edge')
          .style({
            opacity: 0.5,
          })
          .update();
      } else {
        cyHandle
          .style()
          .selector('edge')
          .style({
            opacity: 0,
          })
          .update();
      }

      // parent nodes
      if (settings[SHOW_PARENT_NODES_KEY]) {
        cyHandle
          .style()
          .selector('node:parent[color]')
          .style({
            'background-opacity': 0.75,
            'border-width': 1,
            'text-outline-opacity': 1,
            'text-opacity': 1,
          })
          .update();
      } else {
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

      // parent nodes
      if (settings[SHOW_NODES_KEY]) {
        cyHandle
          .style()
          .selector('node:child')
          .style({
            'text-outline-opacity': 1,
            'text-opacity': 1,
          })
          .update();
      } else {
        cyHandle
          .style()
          .selector('node:child')
          .style({
            'text-outline-opacity': 0,
            'text-opacity': 0,
          })
          .update();
      }

      // if (
      //   settings[SHOW_NODES_KEY] ||
      //   settings[SHOW_PARENT_NODES_KEY] ||
      //   settings[SHOW_EDGES_KEY]
      // ) {
      //   const l = cyHandle.layout(layout);
      //   l.run();
      // }
    }

    return () => {
      // anything in here is fired on component unmount.
    };
  }, [settings, cyHandle]);

  // const handleUseCase = (event) => {
  //   const value = event.target.value;
  //   switch (value) {
  //     case 'genomics':
  //       setUseCase('genomics');
  //       setGraphData(genomicsGraphData);
  //       break;
  //     default:
  //     case 'privacy':
  //       setUseCase('privacy');
  //       setGraphData(privacyGraphData);
  //   }
  // };

  return (
    <>
      <div className="flex flex-col m-5 gap-10">
        <div className="flex flex-row justify-center gap-2">
          {/*<SettingsWrapper title="Data">*/}
          {/*  <div className="flex flex-row gap-2">*/}
          {/*    <SettingsWrapper title="Use Case">*/}
          {/*      <div className="flex flex-col max-w-sm">*/}
          {/*        <div onChange={handleUseCase}>*/}
          {/*          <input*/}
          {/*            type="radio"*/}
          {/*            id="privacy"*/}
          {/*            name="useCase"*/}
          {/*            value="privacy"*/}
          {/*            checked={useCase === 'privacy'}*/}
          {/*          />*/}
          {/*          <label htmlFor="privacy" className="ml-1">*/}
          {/*            Privacy*/}
          {/*          </label>*/}
          {/*          <br />*/}
          {/*          <input*/}
          {/*            type="radio"*/}
          {/*            id="genomics"*/}
          {/*            name="useCase"*/}
          {/*            value="genomics"*/}
          {/*            checked={useCase === 'genomics'}*/}
          {/*          />*/}
          {/*          <label htmlFor="genomics" className="ml-1">*/}
          {/*            Genomics*/}
          {/*          </label>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </SettingsWrapper>*/}
          {/*  </div>*/}
          {/*</SettingsWrapper>*/}
          <div className="m-auto">
            <SettingsWrapper title="Settings">
              <CheckBoxSetting
                id={SHOW_NODES_KEY}
                value={settings[SHOW_NODES_KEY]}
                label="Show Nodes"
                onChange={() => handleCheckbox(SHOW_NODES_KEY)}
              />
              <CheckBoxSetting
                id={SHOW_PARENT_NODES_KEY}
                value={settings[SHOW_PARENT_NODES_KEY]}
                label="Show Categories"
                onChange={() => handleCheckbox(SHOW_PARENT_NODES_KEY)}
              />

              <CheckBoxSetting
                id={SHOW_EDGES_KEY}
                value={settings[SHOW_EDGES_KEY]}
                onChange={() => handleCheckbox(SHOW_EDGES_KEY)}
                label="Show Edges"
              />
            </SettingsWrapper>
          </div>
        </div>
      </div>
      <div className="flex flex-col m-5 gap-10">
        <div className="resize overflow-auto border border-gray-300 max-w-screen m-auto bg-blue-50 dark:bg-blue-900">
          <CytoscapeComponent
            id="privacy"
            elements={[...elements]}
            stylesheet={stylesheet}
            style={{
              width: 'calc(100vw - 50px)',
              height: 'calc(100vh - 200px)',
            }}
            layout={layout}
            cy={(cy) => {
              // todo: enable reshuffling
              setCyHandle(cy);
            }}
          />
        </div>
      </div>
    </>
  );
};
export default App;
