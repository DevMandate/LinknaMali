import React from 'react';
import { Input, Button } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, AudioOutlined } from '@ant-design/icons';
import { useMediaQuery } from '@mui/material';
import './css/SearchBar.css';

const SearchBar = ({isSearchExpanded, toggleSearch}) => {
  const { Search } = Input;

  const suffix = (
    <AudioOutlined
      style={{
        fontSize: 16,
      }}
    />
  );
  const isLargeScreen = useMediaQuery('(min-width: 600px)');
  const onSearch = (value, _e, info) => console.log(info?.source, value);

  return (
    <div className={`search-bar-container justify-center ${isSearchExpanded ? 'expanded' : ''}`}>
      {isLargeScreen ? (
        <Search
          allowClear
          placeholder="Search"
          size="large"
          onSearch={onSearch}
          className='full-search-bar'
        />
      ) : (
        <div className="mobile-search-bar">
          {isSearchExpanded ? (
            <div className="expanded-search">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={toggleSearch} 
                className="back-btn"
              />
              <Search
                allowClear
                placeholder="Search"
                size="large"
                suffix={suffix}
                onSearch={onSearch}
                className='mobile-input'
              />
            </div>
          ) : (
            <Button
              icon={<SearchOutlined />}
              onClick={toggleSearch}
              className="search-icon-btn"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;   