import React from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import Master from './master';
const Company = () => {
  const Company =[ {name:'Property', link:'Contact'}, {name:'Services', link:'Create'}, {name:'About Us',link:'Search'},{name:'FAQ',link:'Agent'} ];
  const Header = 'Company';
  return (
    <>
      <Master data={Company} Heading={Header} Icon={<BusinessIcon sx={{ color: 'var(--text)', fontSize: 24, marginLeft: 1 }} />} />
    </>
  );
};

export default Company;
