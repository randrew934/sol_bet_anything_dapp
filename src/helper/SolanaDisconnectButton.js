import { useWalletDisconnectButton } from '@solana/wallet-adapter-base-ui';
import React,{useState, useEffect} from 'react';


export function SolanaWalletDisconnectButton(props) {
    const { buttonDisabled, buttonState, onButtonClick, walletIcon, walletName } = useWalletDisconnectButton();


    useEffect(() => {
      }, [buttonState]);

    return (   
        <button
        disabled={buttonDisabled}
            onClick={(e) => {
                if (e.defaultPrevented) {
                    return;
                }
                    onButtonClick();
            }}>
                Logout
        </button>
    );
}