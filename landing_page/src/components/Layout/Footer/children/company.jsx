import React from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import Master from './master';
const Company = () => {
  const Company = [
    { name: 'Properties', link: 'properties', external: false },
    { name: 'Service Providers', link: 'service providers', external: false },
    { name: 'About Us', link: 'about us', external: true },
  ];
  
  const Header = 'Company';
  return (
    <>
      <Master data={Company} Heading={Header} Icon={<BusinessIcon sx={{ color: 'var(--text)', fontSize: 24, marginLeft: 1 }} />} />
    </>
  );
};

export default Company;
