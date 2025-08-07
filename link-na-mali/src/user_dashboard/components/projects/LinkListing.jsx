import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import {
  FaHome,
  FaBuilding,
  FaTree,
  FaIndustry,
  FaLink,
  FaUnlink,
  FaTimes
} from 'react-icons/fa'

const BASE_URL = 'https://api.linknamali.ke/projects'

export default function PropertyList({ projectId }) {
  const { userData } = useAppContext()
  const userId = userData?.id || userData?.user_id

  const [properties, setProperties] = useState([])
  const [filteredProps, setFilteredProps] = useState([])
  const [propFilter, setPropFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [alertModal, setAlertModal] = useState({ open: false, message: '', type: '' })
  const [processingId, setProcessingId] = useState(null)
  const [projects, setProjects] = useState([])

  const selectedProjectId = projectId || localStorage.getItem('selectedProjectId')

  // Load data
  useEffect(() => {
    if (userId) {
      fetchProjectsList()
      fetchProperties()
    }
  }, [userId])

  // Re-filter whenever data or filters change
  useEffect(() => {
    let list = properties
    if (propFilter !== 'all') {
      list = list.filter(p => p.type === propFilter)
    }
    if (projectFilter !== 'all') {
      list = list.filter(p => String(p.project_id) === projectFilter)
    }
    setFilteredProps(list)
  }, [properties, propFilter, projectFilter])

  const showAlert = (message, type = 'error') =>
    setAlertModal({ open: true, message, type })

  const closeAlert = () =>
    setAlertModal(prev => ({ ...prev, open: false }))

  async function fetchProjectsList() {
    try {
      const res = await fetch(
        `${BASE_URL}/listusersprojects/${userId}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (res.ok) setProjects(data.projects)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchProperties() {
    setLoading(true)
    try {
      const res = await fetch(
        `${BASE_URL}/userproperties/${userId}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Status ${res.status}`)
      setProperties(data.properties)
    } catch (err) {
      console.error(err)
      showAlert(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function linkProperty(prop) {
    if (!selectedProjectId) {
      showAlert('No project selected for linking.', 'error')
      return
    }
    setProcessingId(prop.id)
    try {
      const res = await fetch(
        `${BASE_URL}/assignpropertyproject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            project_id: selectedProjectId,
            property_type: prop.type,
            property_ids: prop.id
          })
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showAlert(data.message, 'success')
      fetchProperties()
    } catch (err) {
      console.error(err)
      showAlert(err.message, 'error')
    } finally {
      setProcessingId(null)
      localStorage.removeItem('selectedProjectId')
    }
  }

  async function unlinkProperty(prop) {
    setProcessingId(prop.id)
    try {
      const formData = new FormData()
      formData.append('property_id', prop.id)
      formData.append('property_type', prop.type)

      const res = await fetch(
        `${BASE_URL}/removepropertyfromproject`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showAlert(data.message, 'success')
      fetchProperties()
    } catch (err) {
      console.error(err)
      showAlert(err.message, 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const iconMap = {
    apartment: <FaBuilding />,
    house: <FaHome />,
    land: <FaTree />,
    commercial: <FaIndustry />
  }

  const getProjectName = id => {
    const proj = projects.find(p => p.id === id)
    return proj ? proj.name : null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 text-secondary">
        Your Properties
      </h2>

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-sm space-y-4 text-center relative">
            <button
              onClick={closeAlert}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-sm sm:text-base"
            >
              <FaTimes />
            </button>
            <p
              className={`font-medium text-sm sm:text-base ${
                alertModal.type === 'error' ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {alertModal.message}
            </p>
            <button
              onClick={closeAlert}
              className="px-4 py-2 rounded text-sm sm:text-base text-white"
              style={{ backgroundColor: 'var(--secondary-color)' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type Filter */}
        <div>
          <label
            htmlFor="filter"
            className="block text-sm sm:text-base font-medium mb-1"
          >
            Filter by type:
          </label>
          <select
            id="filter"
            value={propFilter}
            onChange={e => setPropFilter(e.target.value)}
            className="border rounded p-2 text-sm sm:text-base w-full"
          >
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        {/* Project Filter */}
        <div>
          <label
            htmlFor="project-filter"
            className="block text-sm sm:text-base font-medium mb-1"
          >
            Filter by project:
          </label>
          <select
            id="project-filter"
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="border rounded p-2 text-sm sm:text-base w-full"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">
          Loading properties…
        </p>
      ) : filteredProps.length === 0 ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">
          No properties found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProps.map(prop => (
            <div
              key={prop.id}
              className="border rounded-lg p-4 sm:p-6 shadow flex flex-col justify-between"
              style={{ borderColor: 'var(--primary-color)' }}
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg sm:text-xl">
                    {iconMap[prop.type] || <FaLink />}
                  </span>
                  <h3
                    className="text-base sm:text-lg font-medium"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {prop.title}
                  </h3>
                </div>
                <p
                  className="capitalize text-xs sm:text-sm"
                  style={{ color: 'var(--secondary-color)' }}
                >
                  {prop.type}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-gray-700">
                  Location: {prop.location || 'N/A'}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-gray-700">
                  Current Project:{' '}
                  {getProjectName(prop.project_id) || (
                    <span className="italic text-gray-400">None</span>
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  prop.project_id
                    ? unlinkProperty(prop)
                    : linkProperty(prop)
                }
                disabled={processingId === prop.id}
                className="mt-4 py-2 rounded text-white font-medium transition disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
                style={{ backgroundColor: 'var(--secondary-color)' }}
              >
                {processingId === prop.id ? (
                  prop.project_id ? 'Unlinking…' : 'Linking…'
                ) : (
                  <>
                    {prop.project_id ? (
                      <FaUnlink className="mr-2 text-xs sm:text-sm" />
                    ) : (
                      <FaLink className="mr-2 text-xs sm:text-sm" />
                    )}
                    <span>
                      {prop.project_id ? 'Unlink' : 'Link to Project'}
                    </span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
