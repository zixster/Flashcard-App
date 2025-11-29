import { Card, Deck, CardType, Mnemonic } from '../types';
import { INITIAL_SRS_DATA } from './srsService';

const DECKS_KEY = 'mem_decks';
const CARDS_KEY = 'mem_cards';

// Helper for environments where crypto.randomUUID might be undefined (non-secure context)
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Seed Data
const seedDecks: Deck[] = [
  { id: 'deck_1', name: 'Spanish Basics', description: 'Essential vocabulary', targetLanguage: 'Spanish', sourceLanguage: 'English', cardCount: 3 },
  { id: 'deck_2', name: 'Pokémon Trivia', description: 'Who is that Pokémon?', targetLanguage: 'English', sourceLanguage: 'English', cardCount: 2 },
  { id: 'deck_3', name: 'Simple Math', description: 'Mental Arithmetic', targetLanguage: 'Math', sourceLanguage: 'Math', cardCount: 0 }
];

const seedCards: Card[] = [
  {
    id: 'card_1',
    deckId: 'deck_1',
    type: CardType.VOCAB,
    front: 'el gato',
    back: 'the cat',
    partOfSpeech: 'noun',
    tags: ['animal'],
    srs: INITIAL_SRS_DATA,
    isFlaggedForEdit: false,
    mnemonics: [],
    language: 'es'
  },
  {
    id: 'card_2',
    deckId: 'deck_1',
    type: CardType.VOCAB,
    front: 'comer',
    back: 'to eat',
    partOfSpeech: 'verb',
    acceptedAlternatives: ['eat', 'eating'],
    tags: ['food', 'verb'],
    srs: INITIAL_SRS_DATA,
    isFlaggedForEdit: false,
    mnemonics: [],
    language: 'es'
  },
  {
    id: 'card_3',
    deckId: 'deck_2',
    type: CardType.TRIVIA,
    front: 'Pikachu',
    back: 'Electric Mouse',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    tags: ['gen1'],
    srs: INITIAL_SRS_DATA,
    isFlaggedForEdit: false,
    mnemonics: [],
    language: 'en'
  }
];

export const getDecks = (): Deck[] => {
  const stored = localStorage.getItem(DECKS_KEY);
  if (!stored) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(seedDecks));
    localStorage.setItem(CARDS_KEY, JSON.stringify(seedCards));
    return seedDecks;
  }
  return JSON.parse(stored);
};

export const getCards = (deckId?: string): Card[] => {
  const stored = localStorage.getItem(CARDS_KEY);
  const allCards: Card[] = stored ? JSON.parse(stored) : [];
  if (deckId) {
    return allCards.filter(c => c.deckId === deckId);
  }
  return allCards;
};

export const saveCard = (card: Card): void => {
  const allCards = getCards();
  const index = allCards.findIndex(c => c.id === card.id);
  if (index >= 0) {
    allCards[index] = card;
  } else {
    allCards.push(card);
  }
  localStorage.setItem(CARDS_KEY, JSON.stringify(allCards));
  
  // Update deck count
  const decks = getDecks();
  const deckIdx = decks.findIndex(d => d.id === card.deckId);
  if (deckIdx >= 0) {
    decks[deckIdx].cardCount = allCards.filter(c => c.deckId === card.deckId).length;
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  }
};

export const addDeck = (name: string, description: string): Deck => {
    const newDeck: Deck = {
        id: generateId(),
        name,
        description,
        targetLanguage: 'Mixed',
        sourceLanguage: 'English',
        cardCount: 0
    }
    const decks = getDecks();
    decks.push(newDeck);
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
    return newDeck;
}

export const createCard = (deckId: string, front: string, back: string, type: CardType = CardType.VOCAB): Card => {
    return {
        id: generateId(),
        deckId,
        type,
        front,
        back,
        tags: [],
        mnemonics: [],
        srs: INITIAL_SRS_DATA,
        isFlaggedForEdit: false
    };
}