import React from 'react';
import Master from './master';
const Legals = () => {
  const Header = 'Terms and Conditions';
  const Legals = [ {name:'Privacy Policy', link:'Privacy'}, {name:'Terms of Use', link:'Terms'}, {name:'Cookie Policy', link:'Cookie'} ];
  return (
    <>
      <Master data={Legals} Heading={Header} />
    </>
  );
};

export default Legals;
