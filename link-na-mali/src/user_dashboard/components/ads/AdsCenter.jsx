import React, { useState } from 'react';
import { List, PlusCircle } from 'lucide-react';
import Create from './Create.jsx';
import Manage from './Manage.jsx';

const PRIMARY_COLOR = '#29327E';

const AdsCenter = () => {
  const [phase, setPhase] = useState('manage'); // 'create' or 'manage'

  return (
    <div className="w-full p-4">
      {/* Page Title and Button Group (Buttons aligned to left) */}
      <div className="flex flex-col sm:flex-row items-center mb-6">
        <div className="flex items-center space-x-2">
          {/* My Ads Button */}
          <button
            onClick={() => setPhase('manage')}
            className={`
              flex items-center font-bold py-2 px-4 rounded transition-colors duration-200
              ${phase === 'manage'
                ? 'bg-[#29327E] hover:bg-[#29327E] text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
          >
            <List className="mr-2" size={18} /> My Ads
          </button>

          {/* Create Ad Button */}
          <button
            onClick={() => setPhase('create')}
            className={`
              flex items-center font-bold py-2 px-4 rounded transition-colors duration-200
              ${phase === 'create'
                ? 'bg-[#29327E] hover:bg-[#29327E] text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
            `}
          >
            <PlusCircle className="mr-2" size={18} /> Create Ad
          </button>
        </div>
      </div>

      {/* Content based on selected phase */}
      {phase === 'create' && <Create onSwitchPhase={setPhase} />}
      {phase === 'manage' && <Manage onSwitchPhase={setPhase} />}
    </div>
  );
};

export default AdsCenter;