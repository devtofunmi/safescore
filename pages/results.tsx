import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import React from 'react';

const ResultsClient = dynamic(() => import('../components/ResultsClient'), { ssr: false });

const Results: NextPage = () => {

  // Page simply renders a client-only component (see components/ResultsClient.tsx)

  return (
    <>
      <Head>
        <title>Predictions - SafeScore</title>
        <meta name="description" content="Your AI-powered football predictions" />
      </Head>
      <ResultsClient />
    </>
  );
};

export default Results;
