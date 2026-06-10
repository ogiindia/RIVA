import { useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

const MAX_ROWS = 6;
const LINE_HEIGHT = 21;
const SPIN_STYLE = { animation: 'spin 1s linear infinite' };

export default function ChatInput({
  value,
  onValueChange,
  onSend,
  disabled = false,
  placeholder = 'Ask a question…',
  inputRef,
}) {
  const autoGrow = useCallback(() => {
    const el = inputRef?.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_ROWS * LINE_HEIGHT;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, [inputRef]);

  useEffect(() => { autoGrow(); }, [value, autoGrow]);

  const handleChange = useCallback((e) => {
    onValueChange(e.target.value);
  }, [onValueChange]);

  const handleSend = useCallback(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    onSend(trimmed);
    onValueChange('');
  }, [value, onSend, onValueChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) handleSend();
    }
  }, [disabled, handleSend]);

  return (
    <div className="chat-input-area">
      <div className="chat-input-group">
        <textarea
          ref={inputRef}
          className="chat-textarea"
          aria-label="Chat message"
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        <button
          className="btn-send"
          onClick={handleSend}
          disabled={disabled || !(value || '').trim()}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 size={16} style={SPIN_STYLE} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
