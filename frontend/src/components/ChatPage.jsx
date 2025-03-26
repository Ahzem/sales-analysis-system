import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPaperPlane, 
  FaArrowLeft, 
  FaRegTrashAlt, 
  FaFileCsv, 
  FaRobot, 
  FaUser, 
  FaDatabase, 
  FaChartBar, 
  FaTable, 
  FaCalculator 
} from 'react-icons/fa';
import api from '../utils/api';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../utils/chatHistoryUtils';
import '../styles/ChatPage.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage = ({ onBack, csvFilename, fileId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions] = useState([
        "Which cake had the highest sales revenue in 2025?",
        "Show me the monthly sales trends for all cakes",
        "What are the top 5 best-selling cakes by quantity?",
        "Compare sales performance between different cake categories",
        "Which cake has the highest profit margin?"
    ]);
    
    const messageEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (fileId) {
            const history = getChatHistory(fileId);
            if (history && history.length > 0) {
                setMessages(history);
            } else {
                // Set default greeting if no history exists
                setMessages([{ 
                    id: 1, 
                    text: `Hello! I'm CakeBuddy, your cake shop analytics assistant. I've analyzed your data from ${csvFilename || 'your CSV file'}. What would you like to know about your sales?`,
                    sender: 'bot',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        }
    }, [fileId, csvFilename]);

    useEffect(() => {
        if (fileId && messages.length > 0) {
            saveChatHistory(fileId, messages);
        }
    }, [messages, fileId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const analyzeMessage = (msg) => {
        setIsLoading(true);
        
        // Detect if this is a simple conversational question
        const isSimpleQuestion = detectSimpleQuestion(msg);
        
        // Only show the analysis animation for data-related questions
        setIsAnalyzing(!isSimpleQuestion);
        
        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            text: msg,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear input field
        setNewMessage('');
        
        // Send message to AI service
        api.post('/chat', { message: msg, csvFilename })
            .then(response => {
                const botMessage = {
                    id: Date.now() + 1,
                    text: response.data.response || "I'm not sure how to answer that based on the data.",
                    sender: 'bot',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botMessage]);
            })
            .catch(error => {
                console.error('Error sending message to AI:', error);
                const errorMessage = {
                    id: Date.now() + 1,
                    text: "I'm sorry, I couldn't process that request. Please try again or ask a different question.",
                    sender: 'bot',
                    isError: true,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, errorMessage]);
            })
            .finally(() => {
                setIsLoading(false);
                setIsAnalyzing(false);
            });
    };

    const detectSimpleQuestion = (message) => {
        // Convert to lowercase for easier comparison
        const msg = message.toLowerCase();
        
        // Define patterns for simple questions
        const conversationalPatterns = [
            'hi', 'hello', 'hey', 'how are you', 'what\'s up', 'good morning', 
            'good afternoon', 'good evening', 'thanks', 'thank you', 'bye',
            'goodbye', 'see you', 'nice', 'awesome', 'great', 'cool',
            'who are you', 'your name', 'what can you do', 'help me', 'you', 'are you',
            'how do you work', 'what is this', 'what do you do', 'what are you',
            'how can you help', 'what help can you provide', 'what is your purpose',
            'what is your function', 'what is your role', 'what is your job',
            'what is your goal', 'what is your objective', 'what is your mission',
            'what is your vision', 'what is your dream', 'what is your aspiration',
            'what is your ambition', 'what is your aim', 'what is your target',
            'what is your destination', 'what is your future', 'what is your plan',
            'what is your strategy', 'what is your tactic', 'what is your approach',
            'what is your method', 'what is your technique', 'what is your style',
            'what is your way', 'what is your manner', 'what is your behavior',
            'what is your attitude', 'what is your character', 'what is your personality',
            'what is your nature', 'what is your essence', 'what is your identity',
        ];
        
        // Check if the message matches any conversational pattern
        return conversationalPatterns.some(pattern => 
            msg.includes(pattern) || 
            msg.length < 15 || // Very short messages are likely conversational
            (msg.split(' ').length < 4) // Messages with few words are likely conversational
        );
    };

    const handleSubmit = async (e) => {
        e && e.preventDefault();
        if (!newMessage.trim()) return;
        
        analyzeMessage(newMessage);
    };

    const handleSuggestionClick = (suggestion) => {
        setNewMessage(suggestion);
        analyzeMessage(suggestion);
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
            if (fileId) {
                clearChatHistory(fileId);
                // Reset to initial message
                setMessages([{ 
                    id: Date.now(), 
                    text: `Hello! I'm CakeBuddy, your cake shop analytics assistant. I've analyzed your data from ${csvFilename || 'your CSV file'}. What would you like to know about your sales?`,
                    sender: 'bot',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        }
    };

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Focus input when component mounts
        inputRef.current?.focus();
    }, []);

    const sanitizeResponse = (text) => {
      // Remove SQL query references and section headers
      const cleanedText = text
        .replace(/SQL Query Used[\s\S]*$/, '') // Remove everything after "SQL Query Used"
        .replace(/Here is the SQL query[\s\S]*?```[\s\S]*?```/g, '') // Remove SQL code blocks
        .replace(/\n*SQL query:[\s\S]*?(?=\n\n|\n$|$)/g, '') // Remove "SQL query:" sections
        .replace(/\n*The SQL query[\s\S]*?(?=\n\n|\n$|$)/g, '') // Remove "The SQL query" sections
        .trim();
        
      return cleanedText;
    };
    
    const renderMessageContent = (text) => {
        const cleanedText = sanitizeResponse(text);
        return (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({node, ...props}) => (
                <table className="markdown-table" {...props} />
              ),
              tr: ({node, isHeader, ...props}) => (
                <tr className={isHeader ? 'header-row' : ''} {...props} />
              ),
              th: ({node, ...props}) => (
                <th className="table-header" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="table-cell" {...props} />
              )
            }}
          >
            {cleanedText}
          </ReactMarkdown>
        );
    };

    return (
        <div className="chat-page">
            <div className="chat-header">
                <button 
                    className="back-button" 
                    onClick={onBack}
                    aria-label="Go back to file upload"
                >
                    <FaArrowLeft />
                </button>
                <div className="header-info">
                    <div className="file-info">
                        <FaFileCsv />
                        <span>{csvFilename || 'Sales Analysis'}</span>
                    </div>
                    <h2>CakeBuddy <span className="bot-subtitle">Analytics Assistant</span></h2>
                </div>
                <button 
                    className="clear-history-button" 
                    onClick={handleClearHistory} 
                    aria-label="Clear chat history"
                    title="Clear chat history"
                >
                    <FaRegTrashAlt />
                </button>
            </div>
            
            <div className="chat-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`message ${message.sender} ${message.isError ? 'error' : ''}`}>
                        <div className="message-avatar">
                            {message.sender === 'bot' ? <FaRobot /> : <FaUser />}
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="sender-name">
                                    {message.sender === 'bot' ? 'CakeBuddy' : 'You'}
                                </span>
                                <span className="message-time">{message.timestamp}</span>
                            </div>
                            <div className="message-text">
                                {renderMessageContent(message.text)}
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message bot loading">
                        <div className="message-avatar">
                            <FaRobot />
                        </div>
                        <div className="message-content">
                            <div className="message-header">
                                <span className="sender-name">CakeBuddy</span>
                                <span className="message-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="message-text">
                                {isAnalyzing ? (
                                    <div className="analyzing-container">
                                        <div className="analysis-animation">
                                            <div className="analysis-icon-container">
                                                <FaDatabase className="analysis-icon database-icon" />
                                                <FaTable className="analysis-icon table-icon" />
                                                <FaChartBar className="analysis-icon chart-icon" />
                                                <FaCalculator className="analysis-icon calc-icon" />
                                            </div>
                                            <div className="analysis-progress">
                                                <div className="analysis-progress-bar"></div>
                                            </div>
                                        </div>
                                        <div className="analyzing-text">
                                            <p>Analyzing sales data from <span className="file-highlight">{csvFilename}</span></p>
                                            <div className="analysis-steps">
                                                <div className="analysis-step">Loading CSV data<span className="check-mark">✓</span></div>
                                                <div className="analysis-step">Processing records<span className="analysis-dots"><span>.</span><span>.</span><span>.</span></span></div>
                                                <div className="analysis-step pending">Running calculations</div>
                                                <div className="analysis-step pending">Preparing insights</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="typing-animation">
                                        <div className="typing-bubble"></div>
                                        <div className="typing-bubble"></div>
                                        <div className="typing-bubble"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messageEndRef} />
            </div>
            
            <div className="suggestions-container">
                {suggestions.map((suggestion, index) => (
                    <button 
                        key={index} 
                        className="suggestion-pill"
                        onClick={() => handleSuggestionClick(suggestion)}
                    >
                        {suggestion.length > 30 ? suggestion.substring(0, 27) + '...' : suggestion}
                    </button>
                ))}
            </div>
            
            <form className="chat-input" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Ask about your sales data..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    ref={inputRef}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    className="send-button"
                    disabled={!newMessage.trim() || isLoading}
                    aria-label="Send message"
                >
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
};

export default ChatPage;