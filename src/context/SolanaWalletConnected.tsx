import { createContext, useContext, useState, useEffect } from "react";
import { useWalletConnectButton } from "@solana/wallet-adapter-base-ui";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

const SolanaWalletConnected = createContext({
  solanaconnectstatus: "hei",
});

export const useSolanaConnect = () => useContext(SolanaWalletConnected);

export const SolanaWalletConnectProvider = ({ children}: any) => {
  const { buttonState } = useWalletConnectButton();
  const [solanastatus, setSolanaStatus] = useState("");


  useEffect(() => {
    setSolanaStatus(buttonState);
  }, [buttonState]);

 // console.log(solanastatus);

  return (
    <SolanaWalletConnected.Provider value={{solanaconnectstatus: solanastatus}}>
      {children}
    </SolanaWalletConnected.Provider>
  );
};
