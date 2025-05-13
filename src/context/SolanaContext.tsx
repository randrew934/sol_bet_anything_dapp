import React, { FC, ReactNode, useMemo } from "react";
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { CivicAuthProvider } from "@civic/auth-web3/react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

// Define Props Type
interface WalletProps {
  children: ReactNode; // Accepts any valid React child elements
}

export const Wallet: FC<WalletProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.

  // You can also provide a custom RPC endpoint.
  //   const endpoint = useMemo(() => network, [network]);

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const _endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/anza-xyz/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new UnsafeBurnerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={_endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <CivicAuthProvider clientId={process.env.REACT_APP_CIVIC_AUTH ?? ''}>
          {children}
        </CivicAuthProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
