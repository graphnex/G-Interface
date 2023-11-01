import React from 'react';

import {
  ButtonGroup,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import Button from '@mui/material/Button';

import Cytoscape from 'cytoscape';

type Props = {
  cy: Cytoscape.Core | undefined;
};
export default function Layout({ cy }: Props) {
  const handleCenter = () => {
    if (cy) {
      const n = cy.nodes();
      cy.fit(n);
    }
  };

  const handleFit = () => {
    if (cy && layout) {
      const visibleNodes = cy.nodes(':visible');

      const l = visibleNodes.layout({
        name: layout,
      });
      l.run();
    }
  };
  const handleLayout = (event: SelectChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      setLayout(String(value));
    }
  };

  const [layout, setLayout] = React.useState<string | null>(null);

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="layout">Layout</InputLabel>
        <Select
          labelId="layout"
          id="layout-id"
          // @ts-ignore
          value={layout}
          label="Layout"
          onChange={handleLayout}
        >
          <MenuItem value={'cola'}>Cola</MenuItem>
          <MenuItem value={'cose'}>Cose</MenuItem>
          <MenuItem value={'fcose'}>Fcose</MenuItem>
          <MenuItem value={'circle'}>Circle</MenuItem>
          <MenuItem value={'concentric'}>Concentric</MenuItem>
          <MenuItem value={'avsdf'}>Avsdf</MenuItem>
          <MenuItem value={'cise'}>Cise</MenuItem>
          <MenuItem value={'cise'}>Grid</MenuItem>
          <MenuItem value={'random'}>Random</MenuItem>
        </Select>
        <ButtonGroup sx={{ alignSelf: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={handleCenter}>
            Center
          </Button>
          <Button variant="outlined" onClick={handleFit} disabled={!layout}>
            Fit
          </Button>
        </ButtonGroup>
      </FormControl>
    </>
  );
}
