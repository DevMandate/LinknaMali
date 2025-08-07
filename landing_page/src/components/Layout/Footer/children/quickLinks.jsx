import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import Master from './master';
const QuickLinks = () => {
  const QuickLinks = [
    { name: 'Search Property', link: 'search', external: false },
    { name: 'FAQ', link: 'Agent', external: false }
  ];const Header = 'Quick Links';
  return (
    <>
      <Master data={QuickLinks} Heading={Header} Icon={<LinkIcon sx={{ color: 'var(--text)', fontSize: 24, marginLeft: 1 }} />} />
    </>
  );
};

export default QuickLinks;
