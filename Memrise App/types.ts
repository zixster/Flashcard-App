export enum CardType {
  VOCAB = 'VOCAB',
  SENTENCE = 'SENTENCE',
  MATH = 'MATH',
  TRIVIA = 'TRIVIA'
}

export interface Mnemonic {
  id: string;
  text: string;
  imageUrl?: string;
  votes: number;
  isAiGenerated: boolean;
}

export interface SRSData {
  interval: number; // Days until next review
  ease: number; // Difficulty multiplier
  dueDate: number; // Timestamp
  streak: number;
  history: number[]; // 0 for fail, 1 for pass
}

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  front: string; // The "Question" or "Foreign Word"
  back: string; // The "Answer" or "Native Word"
  
  // Extended Logic
  acceptedAlternatives?: string[]; // e.g., ["bebe"] for "ella bebe"
  distractors?: string[]; // Specifically NOT looking for these (e.g., "carro" if answer is "coche")
  ignoredPrefixes?: string[]; // e.g., ["el", "la", "un"]
  
  // Metadata
  partOfSpeech?: string;
  language?: string; // For keyboard switching
  tags: string[];
  
  // Content
  audioUrl?: string;
  imageUrl?: string; // Supports GIFs
  mnemonics: Mnemonic[];
  
  // Logic
  srs: SRSData;
  isFlaggedForEdit: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  targetLanguage: string;
  sourceLanguage: string;
  cardCount: number;
}

export interface StudySession {
  cards: Card[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
}