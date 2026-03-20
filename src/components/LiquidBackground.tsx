import React from 'react';

export const LiquidBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00f2ff]/10 rounded-full blur-[120px] animate-[blob_20s_infinite_alternate]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7000ff]/10 rounded-full blur-[150px] animate-[blob_25s_infinite_alternate-reverse]" />
    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#00f2ff]/5 rounded-full blur-[100px] animate-[blob_18s_infinite_alternate]" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
  </div>
);
