// Next, React
import { FC, useEffect, useState, useRef } from 'react';
import Link from 'next/link';


import pkg from '../../../package.json';

import { createQR } from "@solana/pay";


const SOLANA_PAY_URL = "solana:https://solana-pay-demo-loopcreativeandy.vercel.app/api/twitterMint";

export const BasicsView: FC = ({ }) => {

  const qrRef = useRef<HTMLDivElement>()
  useEffect(() => {
    const qr = createQR(SOLANA_PAY_URL, 360, 'white', 'black');

    // Set the generated QR code on the QR ref element
    if (qrRef.current) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    } 
  }, [])

  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
        <div className='text-sm font-normal align-bottom text-right text-slate-600 mt-4'>v{pkg.version}</div>
        <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
          Scan this to mint cNFT:
        </h1>
        
        <div ref={qrRef} />
        
        </div>
      </div>
    </div>
  );
};
