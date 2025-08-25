import React, { useState, useRef, useEffect } from 'react';

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const eventSourceRef = useRef(null);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    try {
      // Create EventSource for Server-Sent Events
      const eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(inputMessage)}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('Stream connected:', data.message);
              break;

            case 'content':
              // Stream content chunks
              setCurrentStreamingMessage(prev => prev + data.content);
              break;

            case 'tool_call_start':
              // Show tool call notification
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `🔧 Calling function: ${data.tool_name}`,
                timestamp: new Date(),
                isToolCall: true,
                toolName: data.tool_name,
                arguments: data.arguments
              }]);
              break;

            case 'tool_call_result':
              // Show tool call result
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ Function ${data.tool_name} completed`,
                timestamp: new Date(),
                isToolResult: true,
                toolName: data.tool_name,
                result: data.result
              }]);
              break;

            case 'final_response':
              // Final response after tool calls
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                timestamp: new Date()
              }]);
              break;

            case 'error':
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${data.message}`,
                timestamp: new Date(),
                isError: true
              }]);
              break;

            case 'done':
              // Stream completed
              if (currentStreamingMessage) {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: currentStreamingMessage,
                  timestamp: new Date()
                }]);
              }
              setIsStreaming(false);
              setCurrentStreamingMessage('');
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setIsStreaming(false);
        setCurrentStreamingMessage('');
        eventSource.close();
      };

    } catch (error) {
      console.error('Error starting stream:', error);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isToolCall = message.isToolCall;
    const isToolResult = message.isToolResult;
    const isError = message.isError;

    return (
      <div
        key={index}
        className={`message ${isUser ? 'user-message' : 'assistant-message'} ${
          isToolCall ? 'tool-call' : ''
        } ${isToolResult ? 'tool-result' : ''} ${isError ? 'error' : ''}`}
      >
        <div className="message-header">
          <span className="role">{isUser ? 'You' : 'Assistant'}</span>
          <span className="timestamp">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>

        <div className="message-content">
          {isToolCall && (
            <div className="tool-call-info">
              <strong>🔧 Function:</strong> {message.toolName}
              <br />
              <strong>Arguments:</strong> {JSON.stringify(message.arguments, null, 2)}
            </div>
          )}

          {isToolResult && (
            <div className="tool-result-info">
              <strong>✅ Result:</strong> {JSON.stringify(message.result, null, 2)}
            </div>
          )}

          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Chat with Function Calling</h2>
        <p>Try asking: "What's the weather in New York?" or "Calculate 15 * 23"</p>
      </div>

      <div className="messages-container">
        {messages.map(renderMessage)}
        {isStreaming && currentStreamingMessage && (
          <div className="message assistant-message streaming">
            <div className="message-header">
              <span className="role">Assistant</span>
              <span className="timestamp">Now</span>
            </div>
            <div className="message-content">
              {currentStreamingMessage}
              <span className="typing-indicator">▋</span>
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here... (Press Enter to send)"
          disabled={isStreaming}
          rows={3}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isStreaming}
          className="send-button"
        >
          {isStreaming ? 'Streaming...' : 'Send'}
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chat-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .chat-header h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .chat-header p {
          margin: 0;
          opacity: 0.9;
        }

        .messages-container {
          height: 500px;
          overflow-y: auto;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          background: #f8f9fa;
        }

        .message {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 12px;
          max-width: 80%;
        }

        .user-message {
          background: #007bff;
          color: white;
          margin-left: auto;
        }

        .assistant-message {
          background: white;
          border: 1px solid #e1e5e9;
          color: #333;
        }

        .tool-call {
          background: #fff3cd;
          border-color: #ffeaa7;
        }

        .tool-result {
          background: #d1ecf1;
          border-color: #bee5eb;
        }

        .error {
          background: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }

        .streaming {
          opacity: 0.8;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          opacity: 0.8;
        }

        .message-content {
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .tool-call-info, .tool-result-info {
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(0,0,0,0.05);
          border-radius: 6px;
          font-size: 14px;
        }

        .typing-indicator {
          animation: blink 1s infinite;
          color: #007bff;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .input-container {
          display: flex;
          gap: 10px;
        }

        textarea {
          flex: 1;
          padding: 15px;
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          font-size: 16px;
          resize: none;
          font-family: inherit;
        }

        textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .send-button {
          padding: 15px 30px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
