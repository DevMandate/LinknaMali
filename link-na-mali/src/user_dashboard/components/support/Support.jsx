import React, { useState, useEffect } from "react";
import Button from "../button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useAppContext } from "../../context/AppContext";
import Chat from "./Chat";
import KnowledgeBase from "./KnowledgeBase";

// New: Dashboard navigation styling (you can also add these rules to your CSS)
const sidebarStyle = {
  width: "200px",
  backgroundColor: "#f4f4f4",
  padding: "20px",
  borderRight: "1px solid #ddd",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const contentStyle = {
  flex: 1,
  padding: "20px",
};

const containerStyle = {
  display: "flex",
  minHeight: "100vh",
};

const Support = () => {
  const { userData } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticket_number, setTicketId] = useState(null);
  const [activePage, setActivePage] = useState("submit");

  const [formData, setFormData] = useState({
    name: userData?.first_name || "",
    email: userData?.email || "",
    subject: "",
    message: "",
    type: "Technical",
    urgency: "Medium",
    evidence: null,
  });

  useEffect(() => {
    if (userData) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        name: userData.first_name,
        email: userData.email,
      }));
      setLoading(false);
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let body;
      if (formData.evidence) {
        const formDataToSend = new FormData();
        formDataToSend.append("email", formData.email.trim());
        formDataToSend.append("type", formData.type.trim());
        formDataToSend.append("subject", formData.subject.trim());
        formDataToSend.append("urgency", formData.urgency.trim());
        formDataToSend.append("message", formData.message.trim());
        formDataToSend.append("evidence", formData.evidence);
        body = formDataToSend;
      } else {
        const dummyFile = new File(["No evidence provided"], "dummy.txt", {
          type: "text/plain",
        });
        const formDataToSend = new FormData();
        formDataToSend.append("email", formData.email.trim());
        formDataToSend.append("type", formData.type.trim());
        formDataToSend.append("subject", formData.subject.trim());
        formDataToSend.append("urgency", formData.urgency.trim());
        formDataToSend.append("message", formData.message.trim());
        formDataToSend.append("evidence", dummyFile);
        body = formDataToSend;
      }

      const response = await fetch("https://api.linknamali.ke/supportticket", {
        method: "POST",
        body,
      });

      if (response.ok) {
        const data = await response.json();
        setTicketId(data.ticket_number);
        setTicketSubmitted(true);
        setFormData((prev) => ({
          ...prev,
          subject: "",
          message: "",
          type: "Technical",
          urgency: "Medium",
          evidence: null,
        }));
        setTimeout(() => {
          setTicketSubmitted(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error("Failed to submit ticket:", errorData);
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
    }
  };

  const renderSubmitPage = () => {
    if (ticketSubmitted) {
      return (
        <div className="bg-white min-h-screen p-8 rounded-lg shadow-lg text-black">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Support</h2>
          <div className="text-center">
            <p className="text-xl text-gray-700">
              Your issue has been noted and a ticket has been raised. Be on the lookout for a response.
            </p>
            <p className="text-lg text-gray-600">Your ticket number is: {ticket_number}</p>
          </div>
        </div>
      );
    }

    return (
      <>
      <>
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Contact Information</h2>
        <div className="mb-8 border-b pb-6 max-w-sm mx-auto px-4">
          <p className="flex items-center text-gray-600 text-sm">
            <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500" />
            <span>Email: support@merimedevelopment.co.ke</span>
          </p>
        </div>
      </>
        <h3 className="text-2xl font-semibold mb-4 text-gray-700 text-center">Submit Ticket</h3>
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto px-4">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
              placeholder="Enter subject"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Type of Request</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              <option value="Technical">Technical</option>
              <option value="Non-technical">Non-technical</option>
              <option value="Sales">Sales</option>
              <option value="Ads">Ads</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
              rows="4"
              placeholder="Write your message here"
              maxLength="200"
            />
            <div className="text-gray-500 text-sm mt-1">Maximum 200 words</div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Attach support document(s) (optional)</label>
            <input
              type="file"
              name="evidence"
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
            />
          </div>
          <div className="text-center">
          <Button type="submit">Submit</Button>
          </div>
        </form>
      </>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          div[style*="min-height: 100vh"] {
            flex-direction: column !important;
          }
          div[style*="border-right: 1px solid #ddd"] {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #ddd !important;
            order: -1 !important;
          }
          div[style*="flex: 1"][style*="padding: 20px"] {
            width: 100% !important;
          }
        }
      `}</style>
      <div style={containerStyle}>
        <div style={sidebarStyle}>
          <Button onClick={() => setActivePage("submit")}>Submit Ticket</Button>
          <Button onClick={() => setActivePage("knowledge")}>Knowledge Base</Button>
          <Button onClick={() => setActivePage("chat")}>Chat</Button>
        </div>
        <div style={contentStyle}>
          {activePage === "submit" && renderSubmitPage()}
          {activePage === "contact" && renderContactPage()}
          {activePage === "knowledge" && <KnowledgeBase />}
          {activePage === "chat" && <Chat userData={userData} />}
        </div>
      </div>
    </>
  );
};

export default Support;