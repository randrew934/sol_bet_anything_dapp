import React, { useState, useEffect, useCallback } from "react";
import { Form, Button, Badge, InputGroup, Container } from "react-bootstrap";
import "./create.css";
import ImageSidebar from "../../components/imagesidebar/imagesidebar";
import "../../helper/SolanaButton.css";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
//import { Program, AnchorProvider, Wallet, web3, Idl } from '@project-serum/anchor';
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";

import { UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";

import devwallet from "../../utils/dev-wallet.json";
import { toast } from "react-toastify";
import { IDL } from "../../utils/idl";

import emailjs, { EmailJSResponseStatus } from "emailjs-com";
import { Loader } from "../../components/loader/loader";

function Create() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [judge, setJudge] = useState("");
  const [isJudgeAuto, setIsJudgeAuto] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [currentOption, setCurrentOption] = useState("");
  const [betPeriodDays, setBetPeriodDays] = useState<number>(0);
  const [betPeriodSeconds, setBetPeriodSeconds] = useState<number>(0);

  const [wAddress, setWAddress] = useState("");
  const [wAmount, setWAmount] = useState("0");
  const [toggleWithdrawal, setToggleWithdrawal] = useState(false);

  const [solanaAccountDisplay, setSolanaAccountDisplay] = useState("-");
  const [solanaAccountBalance, setSolanaAccountBalance] = useState("-");

  const [toggleCreatedGame, setToggleCreatedGame] = useState(false);
  const [userMail, setUserMail] = useState("");
  const [betGameKey, setBetGameKey] = useState("");
  const [betGameLink, setBetGameLink] = useState("");
  const [betTXLink, setBetTxLink] = useState("");

  const [loader, setLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState(
    "This is to test that the Loader is working"
  );

  //Disable functionality
  const [disableFunction, setDisableFunction] = useState(false);

  const { connection } = useConnection();
  const userContext = useUser();

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
          checkBalance();
          setUserMail(userContext.user.email ?? "");
          setToggleWithdrawal(true);
        } catch (error) {
          console.error("Error creating wallet:", error);
          return;
        }
      } else {
        setSolanaAccountDisplay(userContext.solana.address);
        checkBalance();
        setUserMail(userContext.user.email ?? "");
        setToggleWithdrawal(true);
      }
    }
  };

  const sendMail = async (link: string, email: string) => {
    var templateParams = {
      link: link,
      email: email,
    };

    emailjs
      .send(
        process.env.REACT_APP_EJ_SERVICE_ID ?? "",
        process.env.REACT_APP_EJ_TEMPLATE_ID_CG ?? "",
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
      toast.error("error")
      console.log(error);
    }
  };

  const addOption = () => {
    if (currentOption && options.length < 4) {
      setOptions([...options, currentOption]);
      setCurrentOption("");
    }
  };

  const setSelectedAmount = (e: any) => {
    setAmount(e);
  };

  const removeOption = (optionToRemove: string) => {
    setOptions(options.filter((option) => option !== optionToRemove));
  };

  const handleJudgeToggle = () => {
    if (isJudgeAuto) {
      setIsJudgeAuto(false);
      setJudge("");
    } else {
      setIsJudgeAuto(true);
      setJudge("0xSBAJudge");
    }
  };

  const handleBetPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = Number(e.target.value);
    setBetPeriodDays(days);
    setBetPeriodSeconds(days * 24 * 60 * 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setToggleCreatedGame(false);

    const programId = new PublicKey(
      "BtYYc5eyu3Eg1WPsJTE3mh1yXFeknwH4xyqhKL8qRUzW"
    );

    const checker = await authStatusCheckFn();

    if (!checker) {
      toast.error("Wallet not connected");
      return;
    }

    const { publicKey } = userContext?.solana?.wallet;

    // We're going to import our keypair from the wallet file
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

    const admin_seed = [Buffer.from("admin_config")];
    const [adminPDA, _admin_bump] = PublicKey.findProgramAddressSync(
      admin_seed,
      program2.programId
    );

    const adminConfigData = await program.account.adminConfig.fetch(adminPDA);
    const nextBetKey = adminConfigData.nextBetKey;

    const nextBetKeyBuffer = Buffer.alloc(8);
    nextBetKeyBuffer.writeBigUInt64LE(BigInt(nextBetKey.toString()));

    const list_seed = [
      Buffer.from("list"),
      publicKey.toBuffer(),
      nextBetKeyBuffer,
    ];
    const [listPDA, _list_bump] = PublicKey.findProgramAddressSync(
      list_seed,
      program2.programId
    );

    let betJudge;
    if (judge === "0xSBAJudge") {
      betJudge = adminConfigData.admin.toString();
    } else {
      betJudge = judge;
    }

    try {
      //Wallet Adapter
      const tx = await program2.methods
        .createGame(
          name,
          description,
          options,
          new BN(amount * LAMPORTS_PER_SOL),
          new BN(betPeriodSeconds),
          new PublicKey(betJudge)
        )
        .accounts({
          maker: publicKey,
          adminConfig: adminPDA,
          list: listPDA,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const transaction = new Transaction().add(tx);

      console.log(transaction);

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

      const listData = await program.account.list.fetch(listPDA);

      const link = window.location.host + "/" + listPDA.toBase58().toString();
      setBetGameKey(listData?.betKey.toString());
      setBetGameLink(link);
      setBetTxLink(
        `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      );
      setToggleCreatedGame(true);
      toast.success(
        "Game created successfuly. All relevant Game Information has been forwarded to your mail."
      );
      sendMail(link, userMail);
    } catch (error) {
      toast.error("Game Creation Failed.");
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

  useEffect(() => {
    try {
      afterLogin();
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
    <div className="create-game p-3">
      {loader ? <Loader message={loaderMessage} /> : ""}
      <Container
        fluid
        style={
          disableFunction ? { opacity: 0.5, pointerEvents: "none" } : undefined
        }
      >
        {toggleCreatedGame ? (
          <div className="d-flex justify-content-center mt-5">
            <div className="bet-display-container align-items-center justify-content-center p-4">
              <div className="mb-4">
                <h1 className="create-game-heading text-center">
                  Game Created Successfully
                </h1>
              </div>

              <div className="mx-auto text-justify p-2 ">
                <div className="bet-key mb-1 text-center text-muted text-break">
                  <strong>Bet Game Key:</strong> {betGameKey}
                </div>

                <div className="bet-key mb-1 text-center text-muted text-break">
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
                  <a href={betTXLink} target="_blank" rel="noopener noreferrer">
                    {betTXLink}
                  </a>
                </div>

                <div className="text-center">
                  This game link and other information has been forwarded to{" "}
                  {userMail}
                </div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
        <div className="d-flex justify-content-center mt-5">
          <div className="create-game-container align-items-center justify-content-center w-100">
            <div className="create-game-display-container p-4 mb-3 border rounded">
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

            <div className="create-game-display-container p-4 mb-3 border rounded ">
              <div className="mb-4">
                <h1 className="create-game-heading text-center">Create Game</h1>
              </div>

              <Form onSubmit={handleSubmit} className="m-2">
                <Form.Group controlId="formName">
                  <Form.Label className="create-game-form-label">
                    Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter game name"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formDescription">
                  <Form.Label className="create-game-form-label">
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter game description"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formAmount">
                  <Form.Label className="create-game-form-label">
                    Amount in Sol
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={amount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formOptions">
                  <Form.Label className="create-game-form-label">
                    Options
                  </Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="text"
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      placeholder="Add an option"
                      disabled={options.length >= 4}
                    />
                    <Button
                      variant="primary"
                      className="create-game-pill"
                      onClick={addOption}
                      disabled={!currentOption || options.length >= 4}
                    >
                      Add
                    </Button>
                  </InputGroup>
                  <div>
                    {options.map((option, index) => (
                      <Badge key={index} className="me-2 create-game-pill">
                        {option}{" "}
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() => removeOption(option)}
                        >
                          &times;
                        </span>
                      </Badge>
                    ))}
                  </div>
                  {options.length === 4 && (
                    <small className="text-danger">
                      Maximum of 4 options allowed.
                    </small>
                  )}
                </Form.Group>

                <Form.Group controlId="formBetPeriod">
                  <Form.Label className="create-game-form-label">
                    Bet Period (Days)
                  </Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      type="number"
                      value={betPeriodDays}
                      onChange={handleBetPeriodChange}
                      placeholder="Enter number of days"
                      min="1"
                      required
                    />
                    <InputGroup.Text>Days</InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="formJudge">
                  <Form.Label className="create-game-form-label">
                    Judge
                    <Form.Check
                      type="checkbox"
                      label="SBA Judge"
                      className="mt-2 create-game-checkbox"
                      checked={isJudgeAuto}
                      onChange={handleJudgeToggle}
                    />
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={judge}
                    onChange={(e) => setJudge(e.target.value)}
                    placeholder="Enter judge"
                    disabled
                  />
                </Form.Group>

                <div className="create-game-button-holder d-flex align-items-center justify-content-center">
                  <Button
                    variant="success"
                    className="mt-4 create-game-submit"
                    type="submit"
                    disabled={options.length < 2 || options.length > 4}
                  >
                    Create Game
                  </Button>
                </div>
              </Form>
            </div>
          </div>
          <ImageSidebar />
        </div>
      </Container>
    </div>
  );
}

export default Create;
