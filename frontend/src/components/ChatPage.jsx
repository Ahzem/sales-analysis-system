import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaArrowLeft, FaChartLine, FaTable, FaFileCsv, FaDatabase } from 'react-icons/fa';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// In the ChatPage component:
import '../styles/ChatPage.css';
import api from '../utils/api';

const ChatPage = ({ onBack, csvFilename }) => {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            text: `Hello! I'm CakeBuddy, your cake shop analytics assistant. I've analyzed your data from ${csvFilename || 'your CSV file'}. What would you like to know about your sales?`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
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
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Focus input when component mounts
        inputRef.current?.focus();
    }, []);

    const analyzeMessage = (msg) => {
        // Messages that likely need data analysis will set the analyzing state
        const analyzeKeywords = [
            'analyze', 'show', 'report', 'trends', 'best-selling',
            'sales', 'revenue', 'compare', 'profit', 'performance',
            'highest', 'lowest', 'average', 'total', 'month', 'year'
        ];
        
        return analyzeKeywords.some(keyword => 
            msg.toLowerCase().includes(keyword)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsLoading(true);
        
        // Check if this is likely an analysis request
        const needsAnalysis = analyzeMessage(userMessage.text);
        setIsAnalyzing(needsAnalysis);

        try {
            // Call the AI backend
            const response = await api.post('/chat', { 
                message: userMessage.text,
                csvFilename: csvFilename
            });

            // Add bot response with a small delay to feel more natural
            setTimeout(() => {
                setMessages(prev => [
                    ...prev, 
                    {
                        id: prev.length + 1,
                        text: response.data.response || "I'm analyzing your data. I'll have an answer shortly.",
                        sender: 'bot',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                setIsLoading(false);
                setIsAnalyzing(false);
            }, 600);
        } catch (error) {
            console.error("Error communicating with AI agent:", error);
            
            // Add error message
            setTimeout(() => {
                setMessages(prev => [
                    ...prev, 
                    {
                        id: prev.length + 1,
                        text: "Sorry, I encountered an issue processing your request. Please try again.",
                        sender: 'bot',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isError: true
                    }
                ]);
                setIsLoading(false);
                setIsAnalyzing(false);
            }, 600);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setNewMessage(suggestion);
        inputRef.current?.focus();
    };

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
                                        <FaDatabase className="analyzing-icon" />
                                        <div className="analyzing-text">
                                            <p>Analyzing sales data from <span className="file-highlight">{csvFilename}</span></p>
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
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