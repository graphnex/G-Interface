import { ChangeEventHandler, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import Cytoscape from 'cytoscape';
// @ts-ignore
import avsdf from 'cytoscape-avsdf';
// @ts-ignore
import cola from 'cytoscape-cola';
// @ts-ignore
import fcose from 'cytoscape-fcose';

import { ExplanationData } from './WordCloud';
import CheckBoxSetting from './components/CheckBoxSetting';
import ExplanationDataImporter from './components/ExplanationDataImporter';
import SettingsWrapper from './components/SettingsWrapper';
import UseCase from './components/UseCase';
import { defaultWords1 } from './data';
import elements from './data/graph';

Cytoscape.use(fcose);
Cytoscape.use(cola);
Cytoscape.use(avsdf);

const presetData = [
  { label: '3 word-clouds', value: defaultWords1 },
  {
    label: 'single word word-clouds',
    value: [
      {
        category: 'cat2',
        words: [{ id: '2', text: 'World', coef: 0.6 }],
      },
      {
        category: 'cat1',
        words: [{ id: '1', text: 'Hello', coef: 1 }],
      },
      {
        category: 'cat3',
        words: [{ id: '3', text: 'Helllo', coef: 0.55 }],
      },
    ],
  },
];

const convertToString = (obj?: any): string => {
  return JSON.stringify(obj, null, 2);
};

const convertFromString = (obj?: any): any => {
  return JSON.parse(obj);
};

const updateParams = (params: { [key: string]: boolean | string }) => {
  const url = new URL(window.location.href);
  const queryString = new URLSearchParams(url.search);
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      // when value is a boolean we add and remove the value from the url
      value ? queryString.set(key, 'true') : queryString.delete(key);
    } else {
      // when value is a string we set it on the search
      queryString.set(key, value);
    }
  });
  url.search = queryString.toString();
  window.history.replaceState({}, '', url.toString());
};

const PRESET_DATA_KEY = 'presetData';
const HIDE_WORDS_KEY = 'hideWords';
const SHOW_BOUNDS_KEY = 'showBounds';
const SHOW_WORD_BOUNDS_KEY = 'showWordBounds';

const App = () => {
  const params = new URLSearchParams(window.location.search);
  const [settings, setSettings] = useState({
    [HIDE_WORDS_KEY]: params.has(HIDE_WORDS_KEY),
    [SHOW_BOUNDS_KEY]: params.has(SHOW_BOUNDS_KEY),
    [SHOW_WORD_BOUNDS_KEY]: params.has(SHOW_WORD_BOUNDS_KEY),
  });

  const presetDataLabel = params.get(PRESET_DATA_KEY) ?? presetData[0].label;
  const [selectedPresetValue, setSelectedPresetValue] =
    useState(presetDataLabel);
  const [data, setData] = useState<ExplanationData>(
    (presetData.find((p) => p.label === presetDataLabel) ?? presetData[0])
      .value,
  );
  const [explanationData, setExplanationData] = useState(
    convertToString(presetData[0].value),
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputData: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const newValue = event.target.value;
    setExplanationData(newValue);
    try {
      JSON.parse(newValue);
      // reset error message in case there is no more error
      setErrorMessage('');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    }
  };

  const handleCheckbox = (key: keyof typeof settings) => {
    updateParams({ [key]: !settings[key] });
    setSettings((p) => ({ ...p, [key]: !p[key] }));
  };

  const stylesheet = [
    {
      selector: 'node',
      style: {
        // width: "label",
        // height: "data(height)",
        // shape: 'none',
        label: 'data(name)',
        backgroundOpacity: 0,
        fontSize: 'mapData(score, 0, 1, 10, 20)',
        color: 'white',
        textHalign: 'center',
        textValign: 'center',
        textOutlineColor: 'mapData(score, 0, 1, blue, red)',
        textOutlineWidth: 5,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1,
      },
    },
  ];

  // const elements = [
  //     {data: {id: 'one', label: 'Node 1', score: 0.5}, position: {x: 100, y: 100} },
  //     {data: {id: 'two', label: 'Node 2', score: 0.9}, position: {x: 50, y: 50}},
  //     {data: {source: 'one', target: 'two', label: 'Edge from Node1 to Node2'}}
  // ];

  // const layout = { name: 'fcose' };
  // const layout = { name: 'cola' };
  const layout = { name: 'random' };

  return (
    <div className="flex flex-col m-2 gap-2">
      <div className="flex flex-row justify-center gap-2">
        <SettingsWrapper title="Data">
          <div className="flex flex-row gap-2">
            <SettingsWrapper title="From Files">
              <ExplanationDataImporter
                onSubmit={(d) => setExplanationData(convertToString(d))}
              />
            </SettingsWrapper>
            <SettingsWrapper title="From Use-Cases">
              <UseCase
                label="Privacy"
                description="The Privacy use case categorizes concepts extracted from images into clusters of interest."
                nodesFile="./privacy-use-case/nodes.json"
                categoriesFile="./privacy-use-case/categories.json"
                onSubmit={(d) => setExplanationData(convertToString(d))}
              />
            </SettingsWrapper>
            <SettingsWrapper title="From Presets">
              <div>
                <label className="mr-2" htmlFor="preset-data">
                  Preset Data
                </label>
                <select
                  className="p-1 border border-gray-300 rounded bg-transparent"
                  value={selectedPresetValue}
                  onChange={({ target: { value: chosenLabel } }) => {
                    updateParams({ [PRESET_DATA_KEY]: chosenLabel });
                    setSelectedPresetValue(chosenLabel);
                    setExplanationData(
                      convertToString(
                        presetData.find((p) => p.label === chosenLabel)?.value,
                      ),
                    );
                  }}
                >
                  {presetData.map((d) => (
                    <option key={d.label} value={d.label}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="mb-1" htmlFor="data">
                  Explanation Data
                </label>
                <textarea
                  className="bg-transparent rounded border border-gray-300"
                  id="data"
                  name="data"
                  value={explanationData}
                  onChange={handleInputData}
                />
              </div>

              {errorMessage ? <div>Error: {errorMessage}</div> : null}
            </SettingsWrapper>
          </div>
          <div className="flex grow justify-end">
            <button
              className="btn btn-blue self-end"
              onClick={() => setData(convertFromString(explanationData))}
            >
              Update View
            </button>
          </div>
        </SettingsWrapper>
      </div>
      <div className="resize box-border overflow-auto border border-gray-300 max-w-screen m-auto bg-blue-50 dark:bg-blue-900">
        <CytoscapeComponent
          elements={CytoscapeComponent.normalizeElements(elements)}
          stylesheet={stylesheet}
          style={{ width: '1500px', height: '1500px' }}
          layout={layout}
        />
      </div>
      <div className="m-auto">
        <SettingsWrapper title="Settings">
          <CheckBoxSetting
            id={HIDE_WORDS_KEY}
            value={settings[HIDE_WORDS_KEY]}
            label="Show Categories"
            onChange={() => handleCheckbox(HIDE_WORDS_KEY)}
          />
          <CheckBoxSetting
            id={SHOW_BOUNDS_KEY}
            value={settings[SHOW_BOUNDS_KEY]}
            label="Show Category bounds"
            onChange={() => handleCheckbox(SHOW_BOUNDS_KEY)}
          />

          <CheckBoxSetting
            id={SHOW_WORD_BOUNDS_KEY}
            value={settings[SHOW_WORD_BOUNDS_KEY]}
            onChange={() => handleCheckbox(SHOW_WORD_BOUNDS_KEY)}
            label="Show word bounds"
          />
        </SettingsWrapper>
      </div>
    </div>
  );
};
export default App;
