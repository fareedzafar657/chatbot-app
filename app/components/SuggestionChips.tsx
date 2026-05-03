'use client';

const SUGGESTIONS = [
  {
    title: 'Set up a React project',
    prompt: 'How do I set up a new React project with TypeScript and Vite?',
  },
  {
    title: 'Explain async/await',
    prompt: 'Can you explain async/await in JavaScript with practical examples?',
  },
  {
    title: 'Write a utility function',
    prompt: 'Write a TypeScript utility function to deep clone an object safely.',
  },
];

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-md">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.title}
          onClick={() => onSelect(s.prompt)}
          className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 group"
        >
          <div className="text-[13px] font-medium text-gray-800 group-hover:text-gray-900">
            {s.title}
          </div>
          <div className="text-[12px] text-gray-400 mt-0.5 truncate">{s.prompt}</div>
        </button>
      ))}
    </div>
  );
}
