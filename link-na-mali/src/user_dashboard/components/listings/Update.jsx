import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import EditFormRenderer from "./EditFormRenderer";
import { ToastContainer, toast } from "react-toastify";

const UpdateModal = ({ property, onClose, onUpdated }) => {
  const [formData, setFormData] = useState(property);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData(property);
  }, [property]);

  const handleChange = changes => setFormData(prev => ({ ...prev, ...changes }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...formData, user_id: property.user_id };
      const { data } = await axios.put(
        `https://api.linknamali.ke/property/update/${property.id}`,
        payload
      );
      toast.success("Property updated successfully!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Update error", err);
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <ToastContainer />
      <div className="modal-content">
        <button className="close" onClick={onClose}>&times;</button>
        <EditFormRenderer
          initialData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  );
};

UpdateModal.propTypes = {
  property: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
};

export default UpdateModal;
