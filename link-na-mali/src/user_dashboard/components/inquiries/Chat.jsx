import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { generateBotResponse } from './botResponses';

const Chat = () => {
    const [messages, setMessages] = React.useState([]);
    const [userInput, setUserInput] = React.useState('');
    const navigate = useNavigate();

    const handleSend = () => {
        if (userInput.trim() === '') return;

        const newMessage = { text: userInput, sender: 'user', timestamp: new Date() };
        setMessages([...messages, newMessage]);

        // Simulate bot response
        setTimeout(() => {
            const botResponse = generateBotResponse(userInput);
            setMessages(prevMessages => [...prevMessages, { text: botResponse, sender: 'bot', timestamp: new Date() }]);
        }, 1000);

        // Redirect to the inquiries page after sending a message
        setTimeout(() => {
            navigate('/inquiries'); // Navigate to the inquiries page
        }, 2000); // Redirect after 2 seconds to allow user to see their message

        setUserInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="flex flex-col w-full max-w-md mx-auto border border-gray-300 rounded-lg shadow-lg p-4">
            <div className="text-center font-bold text-lg mb-4">Property Inquiry Chat</div>
            <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-2 mb-2" style={{ height: '300px' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        <p className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                            {msg.text}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border border-gray-300 rounded-l-lg p-2"
                    placeholder="Type your message..."
                />
                <button onClick={handleSend} className="bg-blue-500 text-white rounded-r-lg p-2">
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;