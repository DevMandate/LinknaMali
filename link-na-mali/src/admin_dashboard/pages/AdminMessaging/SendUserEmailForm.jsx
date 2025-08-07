import React, { useState } from "react";
import axios from "axios";
import { AsyncPaginate } from "react-select-async-paginate";

const customStyles = {
  control: (base) => ({
    ...base,
    borderColor: "#ccc",
    boxShadow: "none",
    "&:hover": { borderColor: "#8080A0" },
  }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? "#8080A0" : "white",
    color: isFocused ? "white" : "#29327E",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#29327E",
    fontWeight: 600,
  }),
};

const SendUserEmailModal = ({ isOpen, onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [noteType, setNoteType] = useState("Note");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  

  const loadOptions = async (inputValue, loadedOptions, { page }) => {
    try {
      const res = await axios.get("https://api.linknamali.ke/auth/get-all-users", {
        params: {
          q: inputValue,
          page: page,
          limit: 10,
        },
      });

      const options = res.data.users.map((user) => ({
        label: `${user.name} (${user.email})`,
        value: user.user_id,
      }));

      return {
        options,
        hasMore: res.data.has_more,
        additional: { page: page + 1 },
      };
    } catch (err) {
      console.error(err);
      return {
        options: [],
        hasMore: false,
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload = {
        user_id: selectedUser.value,
        subject,
        message_body: messageBody,
        note_type: noteType,
        additional_info: additionalInfo,
      };

      const res = await axios.post("https://api.linknamali.ke/auth/send-user-email", payload);
      setStatusMessage(res.data.message);
      // Reset
      setSelectedUser(null);
      setSubject("");
      setMessageBody("");
      setNoteType("Note");
      setAdditionalInfo("");
    } catch (err) {
      setStatusMessage("Error sending email.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-[#8080A0] text-xl">&times;</button>

        <h2 className="text-2xl font-bold text-[#29327E] mb-4 text-center">Send Email to User</h2>

        {statusMessage && (
          <div className="mb-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded p-3">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select User</label>
            <AsyncPaginate
              value={selectedUser}
              loadOptions={loadOptions}
              onChange={setSelectedUser}
              placeholder="Search users..."
              styles={customStyles}
              additional={{ page: 1 }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Info (optional)</label>
            <input
              type="text"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#29327E] focus:border-[#29327E]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#29327E] text-white font-semibold py-2 px-6 rounded-md hover:bg-[#8080A0] transition-all duration-200"
          >
            Send Email
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendUserEmailModal;
