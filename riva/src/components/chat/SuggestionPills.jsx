import { motion } from 'framer-motion';

const PILL_INITIAL = { opacity: 0, y: 6 };
const PILL_ANIMATE = { opacity: 1, y: 0 };

export default function SuggestionPills({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="chat-suggestions has-suggestions">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={`${suggestion}-${index}`}
          className="suggestion-pill"
          onClick={() => onSelect(suggestion)}
          initial={PILL_INITIAL}
          animate={PILL_ANIMATE}
          transition={{ delay: index * 0.05 }}
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
