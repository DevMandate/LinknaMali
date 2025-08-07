import React, { useState } from 'react'
import { FaList, FaPlus } from 'react-icons/fa'
import Create from './Create'
import Manage from './Manage'

export default function ProjectsDashboard() {
  const [phase, setPhase] = useState('manage')

  const buttonStyles = key =>
    `flex items-center justify-center space-x-2 px-4 py-2 rounded shadow font-medium transition-colors duration-200
     ${phase === key
       ? 'bg-primary-color text-white'
       : 'bg-secondary-color text-white hover:bg-secondary-color/80'}`

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Buttons stack on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-6">
        <button
          onClick={() => setPhase('manage')}
          className={buttonStyles('manage')}
        >
          <FaList />
          <span>Manage</span>
        </button>

        <button
          onClick={() => setPhase('create')}
          className={buttonStyles('create')}
        >
          <FaPlus />
          <span>Create</span>
        </button>
      </div>

      {/* Content card padding adjusts down on mobile */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        {phase === 'create' && <Create onSwitch={setPhase} />}
        {phase === 'manage' && <Manage />}
      </div>
    </div>
  )
}
