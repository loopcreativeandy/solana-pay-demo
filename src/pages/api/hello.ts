// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import type { NextApiRequest, NextApiResponse } from 'next'

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
  const label = 'SolAndy Pay';
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

    const sender = new PublicKey(accountField);


    // Build Transaction
    const ix = SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: new PublicKey("APaynxjiBJBrEX5rqYBTbmSFN4NhPg6TKzkTmhG7URoX"),
      lamports: 133700000
    })

    const transaction = new Transaction();
    transaction.add(ix);

    const connection = new Connection("https://api.devnet.solana.com")
    const bh = await connection.getLatestBlockhash();
    transaction.recentBlockhash = bh.blockhash;
    transaction.feePayer = sender; 

    // airdrop 1 SOL just for fun
    connection.requestAirdrop(sender, 1000000000);

    // Serialize and return the unsigned transaction.
    const serializedTransaction = transaction.serialize({
      verifySignatures: false,
      requireAllSignatures: false,
    });

    const base64Transaction = serializedTransaction.toString('base64');
    const message = 'Thank you for your purchase of ExiledApe #518';

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
