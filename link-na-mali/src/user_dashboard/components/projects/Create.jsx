import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import {
  FaPlus,
  FaProjectDiagram,
  FaMapMarkerAlt,
  FaAlignLeft,
  FaTimes
} from 'react-icons/fa'

const BASE_URL = 'https://api.linknamali.ke'

export default function Created({ onCreate }) {
  const { userData } = useAppContext()
  const userId = userData?.id || userData?.user_id

  const [form, setForm] = useState({ name: '', location: '', description: '' })
  const [alertModal, setAlertModal] = useState({ open: false, message: '', type: '' })
  const [coverImage, setCoverImage] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])

  // ✅ Amenities state
  const [amenityInput, setAmenityInput] = useState("")
  const [amenities, setAmenities] = useState([])

  const showAlert = (message, type = 'error') =>
    setAlertModal({ open: true, message, type })

  const closeAlert = () =>
    setAlertModal(prev => ({ ...prev, open: false }))

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // ✅ Amenity handlers
  const handleAmenityKeyDown = (e) => {
    if (e.key === 'Enter' && amenityInput.trim()) {
      e.preventDefault()
      if (!amenities.includes(amenityInput.trim())) {
        setAmenities([...amenities, amenityInput.trim()])
      }
      setAmenityInput('')
    }
  }

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!userId) {
      showAlert('You must be logged in to create a project.', 'error')
      return
    }

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('name', form.name)
    formData.append('location', form.location)
    formData.append('description', form.description)
    formData.append('amenities', amenities.join(','))  // ✅ Submit amenities

    if (coverImage) {
      formData.append("cover_image", coverImage)
    }

    if (galleryImages.length > 0) {
      galleryImages.forEach(img => {
        formData.append("gallery_images[]", img)
      })
    }

    try {
      const response = await fetch(`${BASE_URL}/projects/createproject`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await response.json()

      if (response.ok) {
        setForm({ name: '', location: '', description: '' })
        setAmenities([])
        setAmenityInput('')
        showAlert('Project created successfully', 'success')
        onCreate?.()
      } else {
        showAlert(data.message || 'Error creating project.', 'error')
      }
    } catch {
      showAlert('Server error while creating project.', 'error')
    }
  }

  return (
    <div className="relative p-4 sm:p-6 bg-white rounded-lg shadow w-full max-w-xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-secondary">
        <FaPlus className="mr-2" /> Create New Project
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Name */}
        <div className="relative">
          <FaProjectDiagram className="absolute top-1/2 transform -translate-y-1/2 left-3 text-gray-400" />
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Project Name"
            required
            className="pl-10 w-full text-sm sm:text-base border rounded p-2 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {/* Location */}
        <div className="relative">
          <FaMapMarkerAlt className="absolute top-1/2 transform -translate-y-1/2 left-3 text-gray-400" />
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="pl-10 w-full text-sm sm:text-base border rounded p-2 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>

        {/* Description */}
        <div className="relative">
          <FaAlignLeft className="absolute top-3 left-3 text-gray-400" />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            rows={4}
            className="pl-10 pt-3 w-full text-sm sm:text-base border rounded p-2 focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
          />
        </div>

        {/* Amenities Input */}
        <div>
          <label className="block mb-1 text-sm font-medium">Amenities</label>
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={handleAmenityKeyDown}
            placeholder="Press Enter after each amenity (e.g. Swimming Pool)"
            className="w-full text-sm border rounded p-2"
          />
          <div className="flex flex-wrap mt-2 gap-2">
            {amenities.map((amenity, index) => (
              <span
                key={index}
                className="bg-secondary text-white text-xs px-2 py-1 rounded-full flex items-center"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(index)}
                  className="ml-1 text-white hover:text-red-300 text-sm"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block mb-1 text-sm font-medium">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setCoverImage(e.target.files[0])}
            className="w-full text-sm border rounded p-2"
          />
        </div>

        {/* Gallery Images Upload */}
        <div>
          <label className="block mb-1 text-sm font-medium">Gallery Images (Min 4)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setGalleryImages([...e.target.files])}
            className="w-full text-sm border rounded p-2"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-2 py-2 rounded text-white font-medium transition-colors duration-200 bg-primary hover:bg-primary-dark flex items-center justify-center text-sm sm:text-base"
        >
          <FaPlus className="mr-2" /> Create
        </button>
      </form>

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="relative bg-white p-4 sm:p-6 rounded-lg w-full max-w-sm mx-auto space-y-4 text-center">
            <button
              onClick={closeAlert}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg"
            >
              <FaTimes />
            </button>
            <p
              className={`font-medium ${alertModal.type === 'error' ? 'text-red-600' : 'text-green-600'} text-sm sm:text-base`}
            >
              {alertModal.message}
            </p>
            <button
              onClick={closeAlert}
              className="px-4 py-1 rounded mt-2 text-sm sm:text-base"
              style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
