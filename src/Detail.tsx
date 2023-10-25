import React, { ReactElement } from 'react';
import toast from 'react-hot-toast';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Box } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';

import { CollectionReturnValue } from 'cytoscape';
import _ from 'lodash';
import pluralize from 'pluralize';
import { prettyPrintJson } from 'pretty-print-json';
import 'pretty-print-json/css/pretty-print-json.dark-mode.css';

import { ErrorToastContainer } from './components/ExplanationDataImporter';

type Props = {
  elements: CollectionReturnValue;
};
export default function Detail({ elements }: Props): ReactElement {
  const showToastError = (err: any) => {
    toast.error((t) => (
      <ErrorToastContainer
        message={err.message}
        onClick={() => toast.dismiss(t.id)}
      />
    ));
  };

  return (
    <Box sx={{ mb: 10, mr: 1, position: 'absolute', right: 0, bottom: 0 }}>
      {elements.map((elem) => {
        const data = elem.data();
        const type = _.capitalize(pluralize.singular(elem.group()));
        const name = data.name || 'Unnamed';
        let content = '';
        try {
          content = prettyPrintJson.toHtml(data);
        } catch (e: any) {
          showToastError(e);
        }
        return (
          <Accordion key={data.id} sx={{ bgcolor: '#2b2929' }}>
            <AccordionSummary
              expandIcon={<ExpandLessIcon sx={{ color: 'white' }} />}
              id={`${data.id}-header`}
            >
              <Typography
                sx={{ color: 'white' }}
              >{`${type}: ${name}`}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre dangerouslySetInnerHTML={{ __html: content }} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
