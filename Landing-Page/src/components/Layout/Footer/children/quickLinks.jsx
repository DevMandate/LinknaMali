import React from 'react';
import LinkIcon from '@mui/icons-material/Link';
import Master from './master';
const QuickLinks = () => {
  const QuickLinks =[ {name:'View Portal', link:'Portal'}, {name:'Create Listing', link:'Create'}, {name:'Search Property',link:'Search'},{name:'Find Agent',link:'Agent'} ];
  const Header = 'Quick Links';
  return (
    <>
      <Master data={QuickLinks} Heading={Header} Icon={<LinkIcon sx={{ color: 'var(--text)', fontSize: 24, marginLeft: 1 }} />} />
    </>
  );
};

export default QuickLinks;
