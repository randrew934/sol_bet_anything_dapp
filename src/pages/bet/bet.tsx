import React, { useCallback, useEffect, useState } from "react";
import { Button, Image, Form, InputGroup, Container } from "react-bootstrap";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./bet.css";
import Icon from "../../assets/coinimage.webp";
import "../../helper/SolanaButton.css";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";

import { toast } from "react-toastify";

import devwallet from "../../utils/dev-wallet.json";
import { IDL } from "../../utils/idl";

import ImageSidebar from "../../components/imagesidebar/imagesidebar";

import { UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";

import emailjs, { EmailJSResponseStatus } from "emailjs-com";
import { Loader } from "../../components/loader/loader";

interface RouteParams {
  linkkey: string;
}

function Bet() {
  const { linkKey } = useParams();
  const [makerState, setMakerState] = useState<string>("");
  const [betKey, setBetkey] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [betaccount, setBetaccount] = useState("");
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState(8);
  const [judge, setJudge] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  const [selectedOption, setSelectedOption] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null
  );

  const [wAddress, setWAddress] = useState("");
  const [wAmount, setWAmount] = useState("0");
  const [toggleWithdrawal, setToggleWithdrawal] = useState(false);

  const [toggleBetGame, setToggleBetGame] = useState(false);
  const [toggleBetButton, setToggleBetButton] = useState(false);
  const [toggleStartGame, setToggleStartGame] = useState(false);
  const [userMail, setUserMail] = useState("");
  const [betGameLink, setBetGameLink] = useState("");
  const [betTxLink, setBetTxLink] = useState("");
  const [createLink, setCreateLink] = useState("");

  const [loader, setLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");

  //Disable functionality
  const [disableFunction, setDisableFunction] = useState(false);

  const [solanaAccountDisplay, setSolanaAccountDisplay] = useState("-");
  const [solanaAccountBalance, setSolanaAccountBalance] = useState("-");

  const { connection } = useConnection();
  const userContext = useUser();

  const navigate = useNavigate();

  function shortenHexString(hexString: any, length = 4) {
    if (hexString?.length <= length * 2) {
      return hexString;
    }

    const prefix = hexString.slice(0, length);
    const suffix = hexString.slice(-length);

    return prefix + ".." + suffix;
  }

  const afterLogin = async () => {
    if (userContext.user) {
      if (!userHasWallet(userContext)) {
        try {
          await userContext.createWallet();
          setSolanaAccountDisplay(userContext.solana.address);
          setBetaccount(userContext.solana.address);
          checkBalance();
          setUserMail(userContext.user.email ?? "");
          setToggleWithdrawal(true);
        } catch (error) {
          console.error("Error creating wallet:", error);
          return;
        }
      } else {
        setSolanaAccountDisplay(userContext.solana.address);
        setBetaccount(userContext.solana.address);
        checkBalance();
        setUserMail(userContext.user.email ?? "");
        setToggleWithdrawal(true);
      }
    }
  };

  const sendMail = async (
    link: string,
    title: string,
    option: string,
    amount: string,
    email: string
  ) => {
    var templateParams = {
      link: link,
      title: title,
      option: option,
      amount: amount,
      email: email,
    };

    emailjs
      .send(
        process.env.REACT_APP_EJ_SERVICE_ID ?? "",
        process.env.REACT_APP_EJ_TEMPLATE_ID_BP ?? "",
        templateParams,
        process.env.REACT_APP_EJ_USERID ?? ""
      )
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
        },
        (error) => {
          console.log("FAILED...", error);
        }
      );
  };

  const checkBalance = async () => {
    try {
      const { publicKey } = userContext?.solana?.wallet;
      if (publicKey) {
        const balance = await connection.getBalance(publicKey);
        setSolanaAccountBalance(
          (balance / LAMPORTS_PER_SOL).toString() + " SOL"
        );
      }
      if (userContext.authStatus == "unauthenticated") {
        setSolanaAccountBalance("-");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const authStatusCheck = async () => {
    try {
      if (userContext.authStatus == "unauthenticated") {
        setSolanaAccountBalance("-");
        setSolanaAccountDisplay("-");
        setToggleWithdrawal(false);
      } else {
        await checkBalance();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const authStatusCheckFn = async () => {
    try {
      if (userContext.authStatus == "authenticated") {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getStatusTitle = (status: number): string => {
    switch (status) {
      case 0:
        return "Game under review";
      case 1:
        return "Open Game";
      case 2:
        return "Game Ended. Winners will be declared soon.";
      case 3:
        return "Under Appeal";
      case 4:
      case 5:
        return "Winner declared";
      case 6:
        return "Game Closed.";
      default:
        return "Unknown Status";
    }
  };

  const getGame = async () => {

    setCreateLink(window.location.origin + "/create");

    const programId = new PublicKey(
      "BtYYc5eyu3Eg1WPsJTE3mh1yXFeknwH4xyqhKL8qRUzW"
    );

    const keypair = Keypair.fromSecretKey(new Uint8Array(devwallet));

    const appWallet: Wallet = {
      payer: keypair,
      publicKey: keypair.publicKey,
      signTransaction: async (tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair);
          return tx;
        } else {
          throw new Error(
            "VersionedTransaction is not supported with this wallet wrapper"
          );
        }
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {
          if (tx instanceof Transaction) {
            tx.partialSign(keypair);
            return tx;
          } else {
            throw new Error("VersionedTransaction is not supported");
          }
        });
      },
    };

    try {
      const provider = new AnchorProvider(connection, appWallet, {
        commitment: "confirmed",
      });

      const idl = await Program.fetchIdl(programId, { connection });

      if (!idl) {
        throw new Error("IDL not found for the provided program ID");
      }

      const program = new Program(IDL, provider);

      if (linkKey !== undefined) {
        const accountData = await program.account.list.fetch(
          new PublicKey(linkKey)
        );
        setMakerState(accountData.maker.toBase58().toString());
        setJudge(accountData.judge.toBase58().toString());
        setBetkey(accountData.betKey?.toString() ?? "");
        setName(accountData.name);
        setAmount(
          parseInt(accountData.amount?.toString() ?? "") / LAMPORTS_PER_SOL
        );
        setStatus(parseInt(accountData.status?.toString() ?? "0"));
        setDescription(accountData.description);
        setOptions(accountData.options);
        setBetGameLink(window.location.origin + "/" + linkKey);
      }
    } catch (error) {
      navigate("/error/404");
      console.error("Error during transaction:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  };

  const withdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();

    const { publicKey } = userContext?.solana?.wallet;

    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(wAddress),
          lamports: parseFloat(wAmount) * LAMPORTS_PER_SOL,
        })
      );

      // Send the transaction
      const signature = await userContext?.solana?.wallet.sendTransaction(
        tx,
        connection
      );
      await connection.confirmTransaction(signature, "confirmed");

      toast.success("Withdrawal Successful.");
      console.log("Transaction confirmed:", signature);
    } catch (error) {
      toast.error("Withdrawal Failed.");
      console.log(error);
    }
  };

  const selectedOptionGroup = async (option: string, index: number) => {
    setSelectedOption(option);
    setSelectedOptionIndex(index);
  };

  const placeBet = async () => {
    if (selectedOptionIndex == null) {
      toast.error("Select an option");
      return;
    }

    setToggleBetGame(false);

    const programId = new PublicKey(
      "BtYYc5eyu3Eg1WPsJTE3mh1yXFeknwH4xyqhKL8qRUzW"
    );

    const checker = await authStatusCheckFn();

    if (!checker) {
      toast.error("Wallet not connected");
      return;
    }

    const { publicKey } = userContext?.solana?.wallet;

    const keypair = Keypair.fromSecretKey(new Uint8Array(devwallet));

    const provider = new AnchorProvider(
      connection,
      userContext?.solana?.wallet,
      {
        commitment: "confirmed",
      }
    );

    const idl = await Program.fetchIdl(programId, { connection });

    if (!idl) {
      throw new Error("IDL not found for the provided program ID");
    }

    const program = new Program(IDL, provider);
    const program2 = new Program(idl, provider);

    const nextBetKeyBuffer = Buffer.alloc(8); // Allocate 8 bytes for u64
    nextBetKeyBuffer.writeBigUInt64LE(BigInt(betKey));

    const list_seed = [
      Buffer.from("list"),
      publicKey.toBuffer(),
      nextBetKeyBuffer,
    ];
    const [listPDA, _list_bump] = PublicKey.findProgramAddressSync(
      list_seed,
      program2.programId
    );

    const bet_seed = [
      Buffer.from("bet"),
      publicKey.toBuffer(),
      nextBetKeyBuffer,
    ];
    const [betPDA, _bet_bump] = PublicKey.findProgramAddressSync(
      bet_seed,
      program2.programId
    );

    try {
      const tx = await program2.methods
        .placeBet(selectedOptionIndex, new BN(amount * LAMPORTS_PER_SOL))
        .accounts({
          user: publicKey,
          list: listPDA,
          bet: betPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction();


      const transaction = new Transaction().add(tx);

      transaction.feePayer = publicKey;
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;

      const signTx = await userContext?.solana?.wallet.signTransaction(
        transaction
      );

      const signature = await connection.sendRawTransaction(signTx.serialize());
      console.log("Transaction signature:", signature);

      await connection.confirmTransaction(signature, "processed");
      console.log("Transaction confirmed!");

      console.log(`Success! Check out your TX here:
https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      const betData = await program.account.bet.fetch(betPDA);
      console.log("Bet Data:", betData);

      setBetTxLink(
        `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      );
      setToggleBetGame(true);
      toast.success(
        "Bet placed successfuly. All relevant Bet Information has been forwarded to your mail."
      );
      sendMail(betGameLink, name, selectedOption, amount.toString(), userMail);
    } catch (error) {
      console.error("Error during transaction:", error);
      toast.error("Bet Failed.")
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
    }
  };

  const feautureUnavailable = async () => {
    toast.error("Feature not yet available");
  };

  useEffect(() => {
    try {
      afterLogin();
      getGame();
      authStatusCheck();

      if (userContext.solana && userContext.solana.address !== undefined) {
        let intervalId = setInterval(authStatusCheck, 10000);
        return () => clearInterval(intervalId);
      }
    } catch (error) {
      console.log(error);
    }
  }, [userContext]);

  return (
    <div className="bet p-3">
      {loader ? <Loader message={loaderMessage} /> : ""}
      <Container
        fluid
        style={
          disableFunction ? { opacity: 0.5, pointerEvents: "none" } : undefined
        }
      >
        {toggleBetGame ? (
          <div className="d-flex justify-content-center mt-5">
            <div className="bet-display-container align-items-center justify-content-center p-4">
              <div className="mb-4">
                <h1 className="bet-game-heading text-center">
                  Bet Placed Successfully
                </h1>
              </div>

              <div className="mx-auto text-justify p-2 w-auto">
                <div className="bet-key mb-1 text-center text-muted">
                  <strong>Bet Game Title:</strong> {name}
                </div>

                <div className="bet-key mb-1 text-center text-muted">
                  <strong>Bet Game Option:</strong> {selectedOption}
                </div>

                <div className="bet-key mb-4 text-center text-muted text-break">
                  <strong>Link:</strong>{" "}
                  <a
                    href={betGameLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {betGameLink}
                  </a>
                </div>

                <div className="bet-key mb-4 text-center text-muted text-break">
                  <strong>Tx Link:</strong>{" "}
                  <a href={betTxLink} target="_blank" rel="noopener noreferrer">
                    {betTxLink}
                  </a>
                </div>

                <div className="text-center">
                  This bet information has been forwarded to {userMail}
                </div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
        <div className="d-flex justify-content-center mt-5">
          <div className="bet-container align-items-center justify-content-center">
            <div className="bet-display-container p-4 mb-3 border rounded">
              <div className="connect-wallet p-0 mt-3 mb-4 mx-auto">
                <UserButton className="login-button" />
              </div>

              <div className="bet-key mb-1 text-center text-muted">
                <strong>Wallet Address:</strong> {solanaAccountDisplay}
              </div>

              <div className="bet-key mb-5 text-center text-muted">
                <strong>Wallet Balance:</strong> {solanaAccountBalance}
              </div>

              {toggleWithdrawal && (
                <Form onSubmit={withdrawFunds} className="m-2">
                  <Form.Group controlId="formWithdrawAddress">
                    <Form.Control
                      type="text"
                      value={wAddress}
                      onChange={(e) => setWAddress(e.target.value)}
                      placeholder="Enter Solana Address"
                      required
                    />
                    {wAddress.length > 1 && (
                      <small className="text-danger mt-2">
                        Confirm the Solana Address before clicking on withdraw.
                      </small>
                    )}
                  </Form.Group>

                  <Form.Group className="mt-3" controlId="formWithdrawAmount">
                    <Form.Control
                      type="number"
                      value={wAmount}
                      onChange={(e) => setWAmount(e.target.value)}
                      placeholder="Enter Amount in Sol"
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="success"
                    className="mt-3 mb-4 withdrawal-funds-submit"
                    type="submit"
                    disabled={
                      wAddress.length < 1 ||
                      parseFloat(wAmount) > parseFloat(solanaAccountBalance)
                    }
                  >
                    Withdraw
                  </Button>
                </Form>
              )}
            </div>
            <div className="bet-display-container p-4 border rounded">

              <div className="mb-4">
                <a href={createLink}
                    target="_blank"
                    rel="noopener noreferrer">
                  Create your game
                </a>
              </div>
              {/* Title */}
              <div className="mb-3">
                <h3 className="bet-title">{name}</h3>
              </div>

              {/* Bet Key */}
              <div className="bet-key mb-1 text-muted">
                <strong>Bet Key:</strong> {betKey}
              </div>

              <div className="bet-key mb-1 text-muted">
                <strong>Bet Maker:</strong> {makerState}
              </div>

              <div className="bet-key mb-4 text-muted">
                <strong>Bet Judge:</strong> {judge}
              </div>

              {/* Status */}
              <div className="bet-key mb-3 text-muted">
                <strong>{getStatusTitle(status)} </strong>
              </div>

              {/* Image */}
              <div className="bet-image-container mb-3">
                <Image src={Icon} alt="Bet image" className="bet-image" fluid />
              </div>

              {/* Description */}
              <div className="bet-description mb-3">
                <h6>{description}</h6>
              </div>

              {/* Pot Amount */}
              <div className="bet-amount mt-3 mb-3">
                <h3>Stake Amount: {amount} SOL</h3>
              </div>

              {/* Options */}
              {status === 1 && (
                <div className="bet-options mt-4 mb-4">
                  {options.map((option, index) => (
                    <Button
                      key={index}
                      className={`btn me-2 mb-2 options-button mx-auto ${
                        selectedOption === option ? "active" : ""
                      }`}
                      onClick={() => {
                        selectedOptionGroup(option, index);
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              <div className="button-holder">
                {/* placebet Button */}
                {status === 1 && (
                  <Button
                    className="actions-bet-buttons"
                    onClick={() => placeBet()}
                  >
                    Place bet
                  </Button>
                )}
              </div>

              <div className="bet-actions">
                {/* Validate Button */}
                {status === 0 && betaccount === judge && (
                  <Button
                    className="actions-bet-buttons"
                    onClick={() => {
                      feautureUnavailable();
                    }}
                  >
                    Validate
                  </Button>
                )}

                {/* Declare Button */}
                {status === 2 && betaccount === judge && (
                  <Button
                    className="actions-bet-buttons"
                    onClick={() => {
                      feautureUnavailable();
                    }}
                  >
                    Declare
                  </Button>
                )}

                {/* Appeal Button */}
                {status === 2 && betaccount !== judge && (
                  <Button
                    className="actions-bet-buttons"
                    onClick={() => {
                      feautureUnavailable();
                    }}
                  >
                    Appeal
                  </Button>
                )}

                {/* Withdraw Button */}
                {status === 6 && betaccount !== judge && (
                  <Button
                    className="actions-bet-buttons"
                    onClick={() => {
                      feautureUnavailable();
                    }}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          </div>
          <ImageSidebar />
        </div>
      </Container>
    </div>
  );
}

export default Bet;
