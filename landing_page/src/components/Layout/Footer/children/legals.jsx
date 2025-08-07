import React from 'react';
import Master from './master';
const Legals = () => {
  const Header = 'Terms and Conditions';
  const Legals = [ 
    {name:'Privacy Policy', link:'policies', external: true, extra: 'privacy'}, 
    {name:'Terms of Use', link:'policies', external: true, extra: 'terms'}, 
    {name:'Cookie Policy', link:'policies', external: true, extra: 'cookie'},
  ];
  return (
    <>
      <Master data={Legals} Heading={Header} />
    </>
  );
};

export default Legals;
