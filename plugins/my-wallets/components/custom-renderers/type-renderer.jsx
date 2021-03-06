import React from 'react';
import PropTypes from 'prop-types';
import {
  svgs,
} from '@codeparticle/whitelabelwallet.styleguide';
import { TRANSACTION_TYPES } from 'plugins/my-wallets/helpers';


const  { SvgReceive, SvgSend } = svgs.icons;
const { RECEIVE } = TRANSACTION_TYPES;

function CustomTypeRenderer ({ data }) {
  const Icon = data.transaction_type === RECEIVE
    ? SvgReceive
    : SvgSend;
  return (
    <Icon className="transaction-type" />
  );
}

CustomTypeRenderer.propTypes = {
  data: PropTypes.object.isRequired,
};

export { CustomTypeRenderer };