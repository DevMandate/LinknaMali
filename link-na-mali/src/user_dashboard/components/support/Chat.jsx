import React, { useState, useEffect } from "react";
import Button from "../button";

const Chat = ({ userData }) => {
  const [chatTickets, setChatTickets] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeResponseTicket, setActiveResponseTicket] = useState(null);
  const [ticketResponses, setTicketResponses] = useState({});
  const [ticketResponseFiles, setTicketResponseFiles] = useState({});

  useEffect(() => {
    const userId = userData?.id || userData?.user_id;
    if (userId) {
      const fetchChatTickets = async () => {
        setChatLoading(true);
        try {
          const response = await fetch(`https://api.linknamali.ke/getusertickets/${userId}`);
          const data = await response.json();
          const ticketsList = Array.isArray(data.tickets)
            ? data.tickets
            : data.user_tickets || data || [];
          const ticketsWithConvo = await Promise.all(
            ticketsList.map(async (ticket) => {
              try {
                const convoResponse = await fetch(
                  `https://api.linknamali.ke/ticketconversations/${ticket.ticket_id}`
                );
                const convoData = await convoResponse.json();
                return { ...ticket, conversation: convoData.conversation };
              } catch {
                return { ...ticket, conversation: [] };
              }
            })
          );
          setChatTickets(ticketsWithConvo);
        } catch (error) {
          console.error("Error fetching chat tickets", error);
        } finally {
          setChatLoading(false);
        }
      };
      fetchChatTickets();
    }
  }, [userData]);

  const handleResponseTextChange = (ticketId, text) => {
    setTicketResponses((prev) => ({ ...prev, [ticketId]: text }));
  };

  const handleResponseFileChange = (ticketId, file) => {
    setTicketResponseFiles((prev) => ({ ...prev, [ticketId]: file }));
  };

  const handleTicketResponse = async (ticketId) => {
    const responseText = ticketResponses[ticketId] || "";
    const responseFile = ticketResponseFiles[ticketId] || null;

    if (!responseText.trim() && !responseFile) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("ticket_id", ticketId);
      formDataToSend.append("email", userData.email);
      formDataToSend.append("user_response", responseText.trim());
      if (responseFile) {
        formDataToSend.append("evidence", responseFile);
      }
      // Always send as FormData regardless of file presence
      const res = await fetch("https://api.linknamali.ke/userrespondticket", {
        method: "POST",
        body: formDataToSend,
      });

      if (res.ok) {
        const convoResponse = await fetch(
          `https://api.linknamali.ke/ticketconversations/${ticketId}`
        );
        const convoData = await convoResponse.json();
        setChatTickets((prevTickets) =>
          prevTickets.map((t) =>
            t.ticket_id === ticketId ? { ...t, conversation: convoData.conversation } : t
          )
        );
        setActiveResponseTicket(null);
        setTicketResponses((prev) => ({ ...prev, [ticketId]: "" }));
        setTicketResponseFiles((prev) => ({ ...prev, [ticketId]: null }));
      }
    } catch (error) {
      console.error("Error sending response:", error);
    }
  };

  const filterDuplicates = (conversation) => {
    const uniqueMessages = [];
    const messageSet = new Set();
    conversation.forEach((msg) => {
      const key = `${msg.sender}-${msg.message}-${msg.sent_at}`;
      if (!messageSet.has(key)) {
        messageSet.add(key);
        uniqueMessages.push(msg);
      }
    });
    return uniqueMessages;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">My Chats</h2>
      {chatLoading ? (
        <p>Loading chats...</p>
      ) : chatTickets.length === 0 ? (
        <p>No chat tickets found.</p>
      ) : (
        chatTickets.map((ticket) => (
          <div key={ticket.ticket_id} className="mb-8 border-b pb-4 max-w-lg mx-auto">
            <h3 className="text-xl font-semibold text-gray-900">
              {ticket.subject} (Ticket #{ticket.ticket_number})
            </h3>
            <div
              className="mt-4 flex flex-col"
              style={{
                backgroundColor: "#e5ddd5",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {ticket.conversation && ticket.conversation.length > 0 ? (
                filterDuplicates(ticket.conversation).map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-bubble ${msg.sender.toLowerCase()}`}
                    style={{
                      alignSelf: msg.sender.toLowerCase() === "admin" ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      padding: "10px",
                      margin: "5px",
                      borderRadius: "15px",
                      backgroundColor: msg.sender.toLowerCase() === "admin" ? "#dcf8c6" : "#fff",
                      boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
                    }}
                  >
                    <p>{msg.message}</p>
                    {msg.evidence && (
                      <img
                        src={msg.evidence}
                        alt="Attachment"
                        style={{ maxWidth: "200px", marginTop: "8px" }}
                      />
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(msg.sent_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p>No conversation messages yet.</p>
              )}
            </div>
            {ticket.conversation && ticket.conversation.length > 0 && (
              <div className="mt-4">
                {activeResponseTicket !== ticket.ticket_id && (
                  <Button onClick={() => setActiveResponseTicket(ticket.ticket_id)}>
                    Reply
                  </Button>
                )}
                {activeResponseTicket === ticket.ticket_id && (
                  <div className="mt-4">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                      rows="3"
                      placeholder="Type your response here..."
                      value={ticketResponses[ticket.ticket_id] || ""}
                      onChange={(e) =>
                        handleResponseTextChange(ticket.ticket_id, e.target.value)
                      }
                    ></textarea>
                    <input
                      type="file"
                      name="responseAttachment"
                      onChange={(e) =>
                        handleResponseFileChange(ticket.ticket_id, e.target.files[0])
                      }
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button onClick={() => handleTicketResponse(ticket.ticket_id)}>
                        Send Response
                      </Button>
                      <Button
                        onClick={() => setActiveResponseTicket(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Chat;
