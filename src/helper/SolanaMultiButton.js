import React from 'react';
import {
    WalletModalProvider,
    BaseWalletMultiButton,
    WalletDisconnectButton,
    WalletMultiButton,
  } from "@solana/wallet-adapter-react-ui";

const LABELS = {
    'change-wallet': 'Change wallet',
    connecting: 'Connecting ...',
    'copy-address': 'Copy address',
    copied: 'Copied',
    disconnect: 'Disconnect',
    'has-wallet': 'Connect',
    'no-wallet': 'Connect Wallet',
};

export function SolanaWalletMultiButton(props) {
    return <BaseWalletMultiButton {...props} labels={LABELS} />;
}