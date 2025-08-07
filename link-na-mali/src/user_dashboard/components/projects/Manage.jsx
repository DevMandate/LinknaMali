import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import {
  FaEdit,
  FaTrash,
  FaLink,
  FaArrowLeft,
  FaExternalLinkAlt
} from 'react-icons/fa'
import LinkListing from './LinkListing'

const API_BASE_URL = 'https://api.linknamali.ke/projects'

export default function Manage() {
  const { userData } = useAppContext()
  const userId = userData?.id || userData?.user_id

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ message: '', type: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [updateConfirmOpen, setUpdateConfirmOpen] = useState(false)

  const [currentProject, setCurrentProject] = useState({ id: '', name: '', location: '' })
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const [linkMode, setLinkMode] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  useEffect(() => {
    if (userId) fetchProjects()
  }, [userId])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/listusersprojects/${userId}`, { credentials: 'include' })
      const { projects } = await res.json()
      setProjects(projects)
    } catch (e) {
      showAlert(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function showAlert(message, type = 'success') {
    setAlert({ message, type })
    setTimeout(() => setAlert({ message: '', type: '' }), 3000)
  }

  function openLinkMode(id) {
    localStorage.setItem('selectedProjectId', id)
    setSelectedProjectId(id)
    setLinkMode(true)
  }
  function closeLinkMode() {
    localStorage.removeItem('selectedProjectId')
    setLinkMode(false)
  }

  function openEditModal(project) {
    setCurrentProject(project)
    setEditModalOpen(true)
  }
  function proceedUpdate(e) {
    e.preventDefault()
    setUpdateConfirmOpen(true)
  }
  async function confirmUpdate() {
    setUpdateConfirmOpen(false)
    setActionLoading(true)
    try {
      const form = new FormData()
      form.append('name', currentProject.name)
      form.append('location', currentProject.location)
      const res = await fetch(`${API_BASE_URL}/updateprojects/${currentProject.id}`, { method: 'PUT', body: form, credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showAlert(data.message)
      fetchProjects()
    } catch (e) {
      showAlert(e.message, 'error')
    } finally {
      setActionLoading(false)
      setEditModalOpen(false)
    }
  }

  function openDeleteConfirm(id) {
    setPendingDeleteId(id)
    setDeleteConfirmOpen(true)
  }
  async function confirmDelete() {
    setDeleteConfirmOpen(false)
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/deleteprojects/${pendingDeleteId}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      showAlert(data.message)
      fetchProjects()
    } catch (e) {
      showAlert(e.message, 'error')
    } finally {
      setActionLoading(false)
      setPendingDeleteId(null)
    }
  }

  if (linkMode) {
    return (
      <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-md">
        <button onClick={closeLinkMode} className="flex items-center text-secondary mb-6 text-sm sm:text-base">
          <FaArrowLeft className="mr-2" /> Back
        </button>
        <LinkListing projectId={selectedProjectId} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-primary">Manage Projects</h2>
      {alert.message && (
        <div className={`px-4 py-3 mb-6 rounded-md text-sm sm:text-base ${alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{alert.message}</div>
      )}
      {loading ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">Loading projects...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {projects.map(p => (
            <div key={p.id} className="border rounded-lg p-4 sm:p-6 flex flex-col justify-between hover:shadow-lg">
              <div>
                <h3 className="text-xl sm:text-2xl mb-2 text-secondary">{p.name}</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{p.location}</p>
              </div>
              <div className="flex justify-end items-center space-x-4 text-lg sm:text-xl">
                <FaExternalLinkAlt onClick={() => openLinkMode(p.id)} className="cursor-pointer text-secondary" title="View Linked" />
                <FaLink onClick={() => openLinkMode(p.id)} className="cursor-pointer text-secondary" title="Link Listings" />
                <FaEdit onClick={() => openEditModal(p)} className="cursor-pointer text-primary" title="Edit Project" />
                <FaTrash onClick={() => openDeleteConfirm(p.id)} className="cursor-pointer text-red-600" title="Delete Project" />
              </div>
            </div>
          ))}
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
          <form onSubmit={proceedUpdate} className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-primary">Edit Project</h3>
            <label className="block text-sm sm:text-base font-medium">Name</label>
            <input value={currentProject.name} onChange={e => setCurrentProject({ ...currentProject, name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm sm:text-base" />
            <label className="block text-sm sm:text-base font-medium">Location</label>
            <input value={currentProject.location} onChange={e => setCurrentProject({ ...currentProject, location: e.target.value })} className="w-full border rounded px-3 py-2 text-sm sm:text-base" />
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-secondary text-white rounded text-sm">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-secondary text-white rounded text-sm">{actionLoading ? 'Updating...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {updateConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs text-center space-y-4">
            <p className="text-sm sm:text-base">Confirm update?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setUpdateConfirmOpen(false)} className="px-4 py-2 bg-secondary text-white rounded text-sm">Cancel</button>
              <button onClick={confirmUpdate} disabled={actionLoading} className="px-4 py-2 bg-secondary text-white rounded text-sm">OK</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-xs text-center space-y-4">
            <p className="text-sm sm:text-base">Confirm delete?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setDeleteConfirmOpen(false)} className="px-4 py-2 bg-secondary text-white rounded text-sm">Cancel</button>
              <button onClick={confirmDelete} disabled={actionLoading} className="px-4 py-2 bg-secondary text-white rounded text-sm">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
