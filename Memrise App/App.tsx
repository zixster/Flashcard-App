import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { getDecks, getCards, addDeck, createCard, saveCard } from './services/storageService';
import { extractVocabFromText, generateMathProblem } from './services/geminiService';
import { calculateNewSRS, isDue } from './services/srsService';
import { Deck, Card, CardType } from './types';
import { StudyCard } from './components/StudyCard';
import { Home, Plus, BookOpen, Settings, Layout, Save, Download } from 'lucide-react';

// -- Page Components defined inline for file constraints --

// 1. Dashboard
const Dashboard = () => {
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    setDecks(getDecks());
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-mem-dark-blue">My Courses</h1>
            <p className="text-gray-500">Ready to water your plants?</p>
         </div>
         <Link to="/import" className="bg-mem-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-mem-dark-blue transition shadow-lg flex items-center gap-2">
            <Download size={18} /> Import Article
         </Link>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {decks.map(deck => (
            <div key={deck.id} className="bg-white rounded-2xl p-0 overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200 group relative">
                <div className="h-32 bg-gradient-to-br from-mem-yellow to-yellow-500 relative p-4 flex flex-col justify-end">
                    <h3 className="text-white font-bold text-xl drop-shadow-md relative z-10">{deck.name}</h3>
                    <BookOpen className="absolute top-4 right-4 text-white opacity-20" size={64} />
                </div>
                <div className="p-4">
                    <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">{deck.description}</p>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
                        <span>{deck.cardCount} words</span>
                        <span>{deck.targetLanguage}</span>
                    </div>
                    <Link 
                        to={`/study/${deck.id}`}
                        className="block w-full text-center py-3 bg-mem-blue text-white rounded-xl font-bold hover:bg-mem-green hover:shadow-lg transition-all"
                    >
                        Start Learning
                    </Link>
                </div>
            </div>
        ))}
        
        {/* Add New Deck Card */}
        <Link to="/create-deck" className="border-4 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-mem-yellow hover:text-mem-yellow transition-colors min-h-[250px] cursor-pointer">
            <Plus size={48} />
            <span className="font-bold mt-2">Create New Course</span>
        </Link>
      </div>
    </div>
  );
};

// 2. Study Mode
const StudyMode = () => {
    // Safe useParams usage
    const params = useParams();
    const deckId = params.deckId;

    const [sessionCards, setSessionCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!deckId) return;

            const allCards = getCards(deckId);
            
            // Generate Math cards dynamically if it's the Math deck
            const deck = getDecks().find(d => d.id === deckId);
            if(deck?.name === 'Simple Math' && allCards.length === 0) {
                 const newCards: Card[] = [];
                 for(let i=0; i<5; i++) {
                     const math = await generateMathProblem();
                     const c = createCard(deckId, math.problem, math.answer, CardType.MATH);
                     newCards.push(c);
                 }
                 setSessionCards(newCards);
            } else {
                 // Filter for due cards
                 const due = allCards.filter(c => isDue(c));
                 // If no due cards, take some new ones or random review
                 const finalSet = due.length > 0 ? due : allCards.sort(() => Math.random() - 0.5).slice(0, 10);
                 setSessionCards(finalSet);
            }
            setLoading(false);
        };
        load();
    }, [deckId]);

    const handleResult = (isCorrect: boolean) => {
        const card = sessionCards[currentIndex];
        
        // Update SRS
        const newSrs = calculateNewSRS(card.srs, isCorrect ? 5 : 0);
        const updatedCard = { ...card, srs: newSrs };
        saveCard(updatedCard);

        if (currentIndex < sessionCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCompleted(true);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Planting seeds...</div>;
    if (sessionCards.length === 0) return <div className="p-10 text-center">No cards found in this deck. Add some!</div>;

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-24 h-24 bg-mem-green rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                    <Save className="text-white" size={48} />
                </div>
                <h2 className="text-3xl font-bold text-mem-dark-blue mb-2">Session Complete!</h2>
                <p className="text-gray-500 mb-8">You've watered your garden today.</p>
                <Link to="/" className="bg-mem-yellow text-mem-dark-blue px-8 py-3 rounded-xl font-bold border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all">
                    Back to Courses
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-2">
                <div 
                    className="bg-mem-green h-2 transition-all duration-500" 
                    style={{ width: `${((currentIndex) / sessionCards.length) * 100}%` }}
                />
            </div>
            
            <StudyCard 
                card={sessionCards[currentIndex]} 
                onResult={handleResult}
                onEdit={() => alert("Edit logic pending")}
            />
        </div>
    );
};

// 3. Import Mode
const ImportMode = () => {
    const [text, setText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState<Array<{front: string, back: string, pos: string}>>([]);
    const [selectedDeck, setSelectedDeck] = useState('');
    const navigate = useNavigate();

    const handleProcess = async () => {
        if(!process.env.API_KEY) {
            alert("Please set API_KEY in env");
            return;
        }
        setProcessing(true);
        const existingCards = getCards().map(c => c.front);
        const extracted = await extractVocabFromText(text, existingCards);
        setResults(extracted);
        setProcessing(false);
    };

    const handleSave = () => {
        if(!selectedDeck) {
            alert("Select a deck first");
            return;
        }
        results.forEach(item => {
            const card = createCard(selectedDeck, item.front, item.back);
            card.partOfSpeech = item.pos;
            saveCard(card);
        });
        alert(`Saved ${results.length} cards!`);
        navigate('/');
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-mem-dark-blue mb-4">Import from Article</h1>
            <p className="mb-4 text-gray-500">Paste a newspaper article below. AI will extract new vocabulary, translate it, and check against your existing database.</p>
            
            <textarea 
                className="w-full h-48 p-4 border rounded-xl focus:border-mem-blue outline-none"
                placeholder="Paste Spanish text here..."
                value={text}
                onChange={e => setText(e.target.value)}
            />
            
            <button 
                onClick={handleProcess}
                disabled={processing || !text}
                className="mt-4 bg-mem-blue text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
            >
                {processing ? "Analyzing..." : "Analyze Text"}
            </button>

            {results.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold mb-4">Found Vocabulary ({results.length})</h3>
                    <div className="max-h-64 overflow-y-auto mb-4">
                        {results.map((r, i) => (
                            <div key={i} className="flex justify-between border-b py-2 text-sm">
                                <span className="font-bold text-mem-blue">{r.front}</span>
                                <span className="text-gray-500 italic">{r.pos}</span>
                                <span className="text-gray-800">{r.back}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-4 items-center border-t pt-4">
                        <select 
                            className="p-2 border rounded"
                            value={selectedDeck}
                            onChange={e => setSelectedDeck(e.target.value)}
                        >
                            <option value="">Select Target Deck</option>
                            {getDecks().map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button onClick={handleSave} className="bg-mem-green text-white px-4 py-2 rounded font-bold">
                            Add All to Deck
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Layout
const LayoutComponent = ({ children }: { children?: React.ReactNode }) => (
    <div className="min-h-screen pb-20">
        <nav className="bg-mem-dark-blue text-white p-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-mem-yellow tracking-tight">MemClone</Link>
                <div className="flex gap-4 text-sm font-bold">
                    <Link to="/" className="hover:text-mem-yellow">Home</Link>
                    <Link to="/import" className="hover:text-mem-yellow">Import</Link>
                </div>
            </div>
        </nav>
        {children}
    </div>
);

const App = () => {
  return (
    <HashRouter>
      <LayoutComponent>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study/:deckId" element={<StudyMode />} />
          <Route path="/import" element={<ImportMode />} />
          <Route path="/create-deck" element={
              <div className="p-10 text-center">
                  <button onClick={() => { addDeck("New Spanish Deck", "Created via button"); window.location.reload(); }} className="bg-mem-blue text-white p-4 rounded">
                      Quick Add Demo Deck
                  </button>
              </div>
          } />
        </Routes>
      </LayoutComponent>
    </HashRouter>
  );
};

export default App;