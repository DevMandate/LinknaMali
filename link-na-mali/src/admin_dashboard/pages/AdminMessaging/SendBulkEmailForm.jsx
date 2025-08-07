import React, { useState } from "react";
import axios from "axios";

const roles = ["Owner", "General_user", "Agent", "Buyer"];


const SendBulkEmailModal = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [noteType, setNoteType] = useState("Notice");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [role, setRole] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    try {
      const payload = {
        subject,
        message_body: messageBody,
        note_type: noteType,
        additional_info: additionalInfo,
        role: role || null,
      };

      const res = await axios.post("https://api.linknamali.ke/auth/send-bulk-email", payload);
      setStatusMessage(res.data.message);

      // Reset form
      setSubject("");
      setMessageBody("");
      setNoteType("Notice");
      setAdditionalInfo("");
      setRole("");
    } catch (err) {
      setStatusMessage("Error sending bulk email.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-[#8080A0] text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold text-[#29327E] mb-4 text-center">Send Bulk Email</h2>

        {statusMessage && (
          <div className="mb-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded p-3">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Enter subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              required
              rows="5"
              placeholder="Enter message"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Note Type
            </label>
            <input
              type="text"
              list="note-type-options"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              placeholder="Select or type note type"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            />
            <datalist id="note-type-options">
              <option value="Notice" />
              <option value="Warning" />
              <option value="Announcement" />
            </datalist>
          </div>


          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Additional Info (optional)
            </label>
            <input
              type="text"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Target Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            >
              <option value="">All Users</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#29327E] text-white font-semibold py-2 px-6 rounded-md hover:bg-[#8080A0] transition-all duration-200"
          >
            {loading ? "Sending..." : "Send Bulk Email"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendBulkEmailModal;
