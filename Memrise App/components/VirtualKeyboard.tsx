import React from 'react';

interface Props {
  language?: string;
  onKeyPress: (char: string) => void;
}

const LAYOUTS: Record<string, string[]> = {
  'default': ['à', 'á', 'è', 'é', 'ì', 'í', 'ñ', 'ò', 'ó', 'ù', 'ú', 'ü'],
  'es': ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
  'de': ['ä', 'ö', 'ü', 'ß'],
  'fr': ['é', 'à', 'è', 'ù', 'â', 'ê', 'î', 'ô', 'û', 'ç', 'ë', 'ï', 'ü'],
  'greek': ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'],
  'runes': ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']
};

export const VirtualKeyboard: React.FC<Props> = ({ language = 'default', onKeyPress }) => {
  const keys = LAYOUTS[language] || LAYOUTS['default'];

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4 p-2 bg-gray-100 rounded-lg">
      {keys.map((char) => (
        <button
          key={char}
          onClick={() => onKeyPress(char)}
          className="w-10 h-10 flex items-center justify-center bg-white border-b-4 border-gray-300 rounded-lg active:border-b-0 active:translate-y-1 hover:bg-gray-50 text-xl font-medium text-mem-blue shadow-sm transition-all"
        >
          {char}
        </button>
      ))}
    </div>
  );
};