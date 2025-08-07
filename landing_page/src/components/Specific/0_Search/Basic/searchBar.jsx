import React from 'react';
import { Input} from 'antd';
import './css/SearchBar.css';

const SearchBar = () => {
  const { Search } = Input;
  const onSearch = (value, _e, info) => console.log(info?.source, value);

  return (
      <Search
        allowClear
        placeholder="Search"
        size="large"
        onSearch={onSearch}
        className='full-search-bar'
      />

  );
};

export default SearchBar;   