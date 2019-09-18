/**
 * @fileoverview Wallet overview page
 * @author Gabriel Womble
 */
import React, { useEffect, useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from 'react-intl';
import { Visible } from '@codeparticle/react-visible';
import {
  Button,
  ButtonVariants,
  IconButton,
  IconVariants,
  List,
  svgs,
} from '@codeparticle/whitelabelwallet.styleguide';
import { red, green } from '@codeparticle/whitelabelwallet.styleguide/styles/colors.scss';
import { VARIANTS } from 'lib/constants';
import { Page } from 'components';

import { setSelectedWallet } from 'plugins/my-wallets/rdx/actions';
import { ManageWalletSidepanel }  from 'plugins/my-wallets/components';
import { getSelectedWallet } from 'plugins/my-wallets/rdx/selectors';
import { getWalletById, ROUTES } from 'plugins/my-wallets/helpers';
import { MY_WALLETS } from 'plugins/my-wallets/translations/keys';
import './wallet-overview.scss';


const { SvgPencil } = svgs.icons;
const { MANAGE_WALLET_BUTTON_LABEL } = MY_WALLETS;
const { PLUGIN } = ROUTES;
const { SECONDARY } = VARIANTS;
const { SLATE } = IconVariants;
const { SLATE_CLEAR } = ButtonVariants;

function ManageButton({ buttonVariant, label, onClick, size }) {
  return (
    <Button
      onClick={onClick}
      size={size}
      variant={buttonVariant}
    >
      {label}
    </Button>
  );
}

function ManageIcon({ iconVariant, iconProps, onClick }) {
  return (
    <IconButton
      onClick={onClick}
      variant={iconVariant}
      icon={<SvgPencil {...iconProps} />}
    />
  );
}

function WalletOverviewView({
  intl: {
    formatMessage,
  },
  match,
  selectedWallet,
  ...props
}) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { name } = selectedWallet;
  const { walletId } = match.params;

  useEffect(() => {
    getWalletById(walletId, props.setSelectedWallet);
  }, [setSelectedWallet]);

  const toggleSidePanel = () => setIsPanelOpen(!isPanelOpen);

  function PrimaryAction({ collapsed, iconProps }) {
    const buttonProps = {
      buttonVariant: SLATE_CLEAR,
      iconProps,
      iconVariant: SLATE,
      label: formatMessage(MANAGE_WALLET_BUTTON_LABEL),
      onClick: toggleSidePanel,
      size: 'sm',
    };

    return (
      <Visible when={!collapsed} fallback={<ManageIcon {...buttonProps} />}>
        <ManageButton {...buttonProps} />
      </Visible>
    );
  }

  function customAmountRenderer({ data, column }) {
    const color = data.type === 'payment'
      ? red
      : green;

    return (
      <Fragment>
        <p>{column}</p>
        <style jsx>
          {`
              p {
                color: ${color};
              }
            `}
        </style>
      </Fragment>
    );
  }

  const chartData = [
    { x: 1, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 5 },
    { x: 4, y: 4 },
    { x: 5, y: 7 },
  ];

  const columnDefs = [
    {
      title: 'Date',
      gridColumns: '1 / 3',
      property: 'date',
    },
    {
      title: 'Address',
      gridColumns: '4 / 7',
      property: 'address',
    },
    {
      title: 'Details',
      gridColumns: '7 / 10',
      property: 'details',
    },
    {
      title: 'Amount',
      gridColumns: '12',
      property: 'amount',
      customRenderer: customAmountRenderer,
    },
  ];

  const onRowClicked = () => {
    console.log('row clicked');
  };

  const dataSet = [
    {
      'date': '2015-02-24 08:23:54',
      'address': 'Address 3',
      'details': 'Deposit from Rosales',
      'type': 'deposit',
      'amount': 'G 0.96',
    },
    {
      'date': '2016-08-20 03:05:56',
      'address': 'Address 8',
      'details': 'Payment to Nieves',
      'type': 'payment',
      'amount': 'G 10.36',
    },
  ];

  return (
    <Page
      headerProps={{
        PrimaryAction,
        title: name || '',
        to: `/${PLUGIN}`,
        type: SECONDARY,
      }}
      removePadding
    >
      <div className="page-content-container">
        <div className="chart-wrapper">
          {/* <AreaChart
            colors={['#B8E986']}
            data={chartData}>
          </AreaChart> */}
          <div className="wallet-balance-data">
            <p>Current Balance</p>
            <p>G 1,033.1892</p>
            <span>$5,911.19 USD</span>
          </div>
        </div>
        <div className="list-wrapper">
          <List
            id="wallet-list"
            isStriped
            columnDefs={columnDefs}
            onRowClicked={onRowClicked}
            rowData={dataSet}
          />
        </div>
      </div>
      <ManageWalletSidepanel
        formatMessage={formatMessage}
        isOpen={isPanelOpen}
        onClose={toggleSidePanel}
        setSelectedWallet={props.setSelectedWallet}
        wallet={selectedWallet}
      />
    </Page>
  );
}

WalletOverviewView.propTypes = {
  intl: intlShape.isRequired,
  match: PropTypes.object.isRequired,
  selectedWallet: PropTypes.object,
  setSelectedWallet: PropTypes.func.isRequired,
};

WalletOverviewView.defaultProps = {
  selectedWallet: {},
};

const mapStateToProps = (state) => {
  const selectedWallet = getSelectedWallet(state);

  return {
    selectedWallet,
  };
};

const mapDispatchToProps = {
  setSelectedWallet,
};

export const WalletOverviewPage = connect(mapStateToProps, mapDispatchToProps)(injectIntl(WalletOverviewView));
