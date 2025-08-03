import { useState } from 'react';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import EmojiPickerButton from './EmojiPickerButton';

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form className="message-input-container" onSubmit={handleSubmit}>
      <div className="input-actions">
        <EmojiPickerButton onEmojiClick={handleEmojiSelect} />
        <button type="button" className="attachment-button">
          <FiPaperclip />
        </button>
      </div>
      
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        aria-label="Message input"
      />
      
      <button 
        type="submit" 
        className="send-button"
        disabled={!message.trim()}
        aria-label="Send message"
      >
        <FiSend />
      </button>
    </form>
  );
};

export default MessageInput;