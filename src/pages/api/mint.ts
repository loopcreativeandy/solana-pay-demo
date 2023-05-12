// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionConfirmationStrategy } from '@solana/web3.js'
import {PROGRAM_ID as BUBBLEGUM_PROGRAM_ID, createMintToCollectionV1Instruction, TokenProgramVersion} from "@metaplex-foundation/mpl-bubblegum";
import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID, ValidDepthSizePair, getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  } from "@metaplex-foundation/mpl-token-metadata";
import type { NextApiRequest, NextApiResponse } from 'next'
import * as base58 from "base-58";

type GetData = {
  label: string
  icon: string
}
type PostData = {
  transaction: string,
  message?: string
}

function get(
  req: NextApiRequest,
  res: NextApiResponse<GetData>
  ) {
  const label = 'SolAndy Pay Minter';
  const icon = 'https://avatars.githubusercontent.com/u/92437260?v=4';

  res.status(200).send({
      label,
      icon,
  });
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<PostData>
  ) {
    // Account provided in the transaction request body by the wallet.
    const accountField = req.body?.account;
    if (!accountField) throw new Error('missing account');

    const user = new PublicKey(accountField);

    const merchant = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse("[226,230,33,166,183,94,221,240,76,0,177,119,22,166,134,93,69,185,83,121,221,13,229,219,18,55,91,84,86,112,53,87,139,130,97,105,159,216,5,167,211,57,175,154,105,195,156,4,68,100,253,224,35,32,204,44,126,175,226,176,146,254,206,226]")),
    );

    const authority = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse("[59,4,171,41,219,175,7,182,29,107,125,240,140,208,8,105,85,62,90,159,200,194,193,118,10,238,48,240,140,189,111,157,168,226,24,148,198,203,151,252,41,12,162,93,12,245,169,23,187,222,193,17,205,228,2,152,196,10,12,217,87,24,189,95]")),
    ); // tree and collection authority
    
    const tree = new PublicKey("Feywkti8LLBLfxhSGmYgzUBqpq89qehfB1SMTYV1zCu");

    // Build Transaction
    const ix = await createMintCNFTInstruction(tree, user, authority.publicKey);


    let transaction = new Transaction();
    transaction.add(ix);

    const connection = new Connection("https://api.devnet.solana.com")
    const bh = await connection.getLatestBlockhash();
    transaction.recentBlockhash = bh.blockhash;
    transaction.feePayer = merchant.publicKey; 

    // for correct account ordering 
    transaction = Transaction.from(transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    }));

    transaction.sign(merchant, authority);
    console.log(transaction.signature);
    console.log(base58.encode(transaction.signature));

    console.log(transaction);

    // Serialize and return the unsigned transaction.
    const serializedTransaction = transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    });

    const base64Transaction = serializedTransaction.toString('base64');
    const message = 'Thank you for using AndyPay';

    // const strategy : TransactionConfirmationStrategy =  {
    //   signature: transaction.
    // }
    // connection.confirmTransaction();

    res.status(200).send({ transaction: base64Transaction, message });

}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetData|PostData>
) {
  if(req.method == "GET"){
    console.log("received GET request");
    return get(req, res);
  } else if(req.method == "POST"){
    console.log("received POST request");
    return await post(req, res);
  }
}






async function createMintCNFTInstruction(merkleTree: PublicKey, account: PublicKey, authority: PublicKey) {

    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
        [merkleTree.toBuffer()],
        BUBBLEGUM_PROGRAM_ID,
      );
      
    const collectionMint = new PublicKey("CoLLES42WAZkkYA84xUG2Z7f2xMz4ATM32F4SYXnZKJ4")
    const [collectionMetadataAccount, _b1] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf8"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const [collectionEditionAccount, _b2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata", "utf8"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          collectionMint.toBuffer(),
          Buffer.from("edition", "utf8"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const [bgumSigner, __] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_cpi", "utf8")],
        BUBBLEGUM_PROGRAM_ID
      );
    const ix = await createMintToCollectionV1Instruction({
        treeAuthority: treeAuthority,
        leafOwner: account,
        leafDelegate: account,
        merkleTree: merkleTree,
        payer: account,
        treeDelegate: authority,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        collectionAuthority: authority,
        collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
        collectionMint: collectionMint,
        collectionMetadata: collectionMetadataAccount,
        editionAccount: collectionEditionAccount,
        bubblegumSigner: bgumSigner,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    }, {
        metadataArgs: {
            collection: {key:collectionMint, verified: false},
            creators: [],
            isMutable: true,
            name: "a cNFT form AndyPay",
            primarySaleHappened: true,
            sellerFeeBasisPoints: 0,
            symbol: "cNFT",
            uri: "https://arweave.net/euAlBrhc3NQJ5Q-oJnP10vsQFjTV7E9CgHZcVm8cogo",
            uses: null,
            tokenStandard: null,
            editionNonce: null,
            tokenProgramVersion: TokenProgramVersion.Original
        }
    });
    
    return ix;
}