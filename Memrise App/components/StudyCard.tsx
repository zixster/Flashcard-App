import React, { useState, useEffect } from 'react';
import { Card, CardType, Mnemonic } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { generateMnemonic } from '../services/geminiService';
import { Volume2, Edit, Flag, Lightbulb } from 'lucide-react';

interface Props {
  card: Card;
  onResult: (isCorrect: boolean) => void;
  onEdit: () => void;
}

enum Mode {
  RECOGNITION, // Choose correct answer
  RECALL, // Type the answer
  AUDIO, // Listen and type
  ORDER // Sentence building
}

export const StudyCard: React.FC<Props> = ({ card, onResult, onEdit }) => {
  const [mode, setMode] = useState<Mode>(Mode.RECOGNITION);
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [newMnemonic, setNewMnemonic] = useState<Mnemonic | null>(null);
  const [loadingMem, setLoadingMem] = useState(false);

  // Determine mode based on card type and randomness
  useEffect(() => {
    setInput('');
    setShowFeedback(false);
    setNewMnemonic(null);
    
    if (card.type === CardType.SENTENCE) {
      setMode(Mode.ORDER);
    } else if (card.type === CardType.VOCAB && Math.random() > 0.5) {
        setMode(Mode.RECALL);
    } else {
        setMode(Mode.RECOGNITION);
    }
  }, [card]);

  const handleCheck = () => {
    if (showFeedback) return; // Prevent double submit

    let correct = false;
    const cleanInput = input.trim().toLowerCase();
    const cleanBack = card.back.toLowerCase();
    const accepted = [cleanBack, ...(card.acceptedAlternatives || []).map(a => a.toLowerCase())];

    if (accepted.includes(cleanInput)) {
      correct = true;
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    // Delay before moving to next
    setTimeout(() => {
        onResult(correct);
    }, correct ? 1500 : 4000); // Longer delay on fail to read feedback
  };

  const generateMem = async () => {
    setLoadingMem(true);
    const mem = await generateMnemonic(card.front, card.back);
    setNewMnemonic(mem);
    setLoadingMem(false);
  };

  const playAudio = () => {
      // If we had real audio URLs, play here. 
      // Fallback to browser TTS
      const u = new SpeechSynthesisUtterance(card.front);
      // Try to guess lang based on detected chars or stored metadata
      u.lang = card.language || 'es-ES'; 
      window.speechSynthesis.speak(u);
  };

  // Sub-components for different modes
  
  const renderRecognition = () => {
    // Generate distractors (in a real app, pick random words from same deck)
    const options = [card.back, "Incorrect 1", "Incorrect 2", "Incorrect 3"].sort(() => Math.random() - 0.5);
    
    return (
      <div className="grid grid-cols-1 gap-4 mt-6">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => {
                if(showFeedback) return;
                setInput(opt); 
                // Immediate check for multiple choice
                const cleanOpt = opt.toLowerCase();
                const cleanBack = card.back.toLowerCase();
                const correct = cleanOpt === cleanBack;
                setIsCorrect(correct);
                setShowFeedback(true);
                setTimeout(() => onResult(correct), correct ? 1000 : 2500);
            }}
            className={`p-4 text-lg border-2 rounded-xl transition-all ${
              showFeedback 
                ? (opt === card.back ? 'bg-mem-green text-white border-mem-green' : 'bg-mem-red text-white border-mem-red opacity-50')
                : 'bg-white border-gray-200 hover:border-mem-yellow hover:bg-yellow-50 text-mem-blue'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  const renderTyping = () => {
    return (
      <div className="mt-6 flex flex-col items-center">
         <div className="w-full relative">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="Type answer..."
                autoFocus
                className={`w-full p-4 text-xl border-2 rounded-xl outline-none transition-colors ${
                    showFeedback 
                    ? (isCorrect ? 'border-mem-green bg-green-50 text-mem-green' : 'border-mem-red bg-red-50 text-mem-red')
                    : 'border-gray-300 focus:border-mem-yellow'
                }`}
            />
            {showFeedback && !isCorrect && (
                <div className="mt-2 text-center">
                    <p className="text-gray-500">Correct answer:</p>
                    <p className="text-xl font-bold text-mem-blue">{card.back}</p>
                    {card.mnemonics.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200 text-sm">
                            <span className="font-bold">Mnemonic:</span> {card.mnemonics[0].text}
                        </div>
                    )}
                </div>
            )}
         </div>

         <VirtualKeyboard 
            language={card.language} 
            onKeyPress={(char) => setInput(prev => prev + char)} 
         />

         {!showFeedback && (
             <button 
                onClick={handleCheck}
                className="mt-4 w-full py-3 bg-mem-yellow text-mem-dark-blue font-bold rounded-xl shadow-b-4 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all"
             >
                Check Answer
             </button>
         )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
       {/* Header with Tools */}
       <div className="flex justify-between items-center mb-8 text-gray-400">
            <div className="flex gap-2">
                <button onClick={onEdit} className="hover:text-mem-blue" title="Edit Card"><Edit size={20}/></button>
                <button className="hover:text-mem-red" title="Report/Edit Later"><Flag size={20}/></button>
            </div>
            <button 
                onClick={playAudio} 
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-mem-blue hover:bg-mem-yellow transition-colors"
            >
                <Volume2 size={20} />
            </button>
       </div>

       {/* Main Content */}
       <div className="text-center mb-8">
            <h2 className="text-gray-500 font-medium uppercase tracking-wide text-sm mb-2">
                {mode === Mode.RECALL ? 'Translate this' : 'What is this?'}
            </h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                {card.imageUrl && <img src={card.imageUrl} alt="Card visual" className="mx-auto mb-4 max-h-48 rounded-lg object-contain" />}
                <h1 className="text-4xl font-bold text-mem-dark-blue mb-2">{card.front}</h1>
                {card.partOfSpeech && <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded uppercase">{card.partOfSpeech}</span>}
            </div>
       </div>

       {/* Interaction Area */}
       {mode === Mode.RECOGNITION ? renderRecognition() : renderTyping()}

       {/* Mnemonic Helper (Shows if wrong or requested) */}
       {(showFeedback && !isCorrect) && (
           <div className="mt-8">
               <div className="flex justify-center mb-4">
                   <button 
                    onClick={generateMem}
                    disabled={loadingMem}
                    className="flex items-center gap-2 text-mem-blue bg-white px-4 py-2 rounded-full shadow-sm hover:shadow border border-gray-200 text-sm font-medium"
                   >
                       <Lightbulb size={16} className="text-mem-yellow" />
                       {loadingMem ? "Thinking..." : "Help me remember this"}
                   </button>
               </div>
               {newMnemonic && (
                   <div className="animate-fade-in p-4 bg-yellow-50 border border-mem-yellow rounded-lg text-mem-dark-blue text-center">
                       "{newMnemonic.text}"
                   </div>
               )}
           </div>
       )}
    </div>
  );
};