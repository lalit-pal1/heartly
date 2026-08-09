'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface Surprise {
  id: string;
  title: string;
  occasion: string;
  recipientName: string;
  relationship: string;
  memories: Memory[];
  message: string;
  music: string; // audio track URL/slug
  theme: 'dreamy' | 'midnight' | 'sunset' | 'nordic';
  effects: {
    passwordLock?: string;
    countdownDate?: string;
    midnightUnlock?: boolean;
  };
  plan: 'free' | 'basic' | 'premium' | 'luxury';
  views: number;
  status: 'active' | 'draft';
  createdAt: string;
  cuteNoButton?: boolean;
  hiddenEndingUrl?: string | null;
}

interface HeartlyContextType {
  surprises: Surprise[];
  addSurprise: (surprise: Omit<Surprise, 'id' | 'views' | 'createdAt'>) => string;
  updateSurprise: (id: string, updated: Partial<Surprise>) => void;
  deleteSurprise: (id: string) => void;
  getSurpriseById: (id: string) => Surprise | undefined;
  incrementViews: (id: string) => void;
}

const HeartlyContext = createContext<HeartlyContextType | undefined>(undefined);

// Seeds sample surprises when LocalStorage is empty
const SAMPLE_SURPRISES: Surprise[] = [
  {
    id: 'demo-birthday',
    title: 'Happy Birthday Sophia!',
    occasion: 'Birthday',
    recipientName: 'Sophia',
    relationship: 'Best Friend',
    memories: [
      {
        id: 'm1',
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
        caption: 'The night we got lost in the city and ended up laughing until sunrise.'
      },
      {
        id: 'm2',
        imageUrl: 'https://images.unsplash.com/photo-1496302661278-520520ef2246?w=600&auto=format&fit=crop&q=80',
        caption: 'Remember this? The best beach trip ever!'
      },
      {
        id: 'm3',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
        caption: 'Celebrating your graduation. You made me so, so proud!'
      }
    ],
    message: `Dear Sophia,\n\nHappy Birthday! I can't believe another year has flown by. From late-night study sessions with cold coffee to travelling across the state, you've been my constant anchor.\n\nThank you for always listening, for making me laugh when I wanted to cry, and for simply being the incredible human being that you are.\n\nHere is to many more wild adventures, messy rooms, and endless laughter. I hope today brings you as much joy as you bring into my life every single day!\n\nWith all my love,\nEmma`,
    music: 'piano',
    theme: 'dreamy',
    effects: {
      countdownDate: '',
      passwordLock: '',
      midnightUnlock: false
    },
    plan: 'premium',
    views: 14,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-anniversary',
    title: '3 Years Together',
    occasion: 'Anniversary',
    recipientName: 'David',
    relationship: 'Partner',
    memories: [
      {
        id: 'n1',
        imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80',
        caption: 'Our very first date. I was so nervous I spilled coffee on myself.'
      },
      {
        id: 'n2',
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
        caption: 'Cooking dinner together. We burnt the pasta but it was perfect.'
      },
      {
        id: 'n3',
        imageUrl: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=600&auto=format&fit=crop&q=80',
        caption: 'Standing on top of the mountain. We made it!'
      }
    ],
    message: `Hey David,\n\nHappy 3rd Anniversary! It feels like just yesterday we met in that small library, both reaching for the same book.\n\nThank you for loving me at my best, and more importantly, at my worst. Thank you for the quiet mornings, the warm hugs, and for building a beautiful home with me. I appreciate every little moment we share.\n\nI love you more than words can say. Excited for all the chapters we are yet to write together.\n\nAlways yours,\nSarah`,
    music: 'ambient',
    theme: 'midnight',
    effects: {
      countdownDate: '',
      passwordLock: '1234',
      midnightUnlock: false
    },
    plan: 'luxury',
    views: 82,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export function HeartlyProvider({ children }: { children: React.ReactNode }) {
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('heartly_surprises');
      if (stored) {
        setSurprises(JSON.parse(stored));
      } else {
        setSurprises(SAMPLE_SURPRISES);
        localStorage.setItem('heartly_surprises', JSON.stringify(SAMPLE_SURPRISES));
      }
      setIsInitialized(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('heartly_surprises', JSON.stringify(surprises));
    }
  }, [surprises, isInitialized]);

  const addSurprise = (newSurprise: Omit<Surprise, 'id' | 'views' | 'createdAt'>) => {
    const id = 'hr-' + Math.random().toString(36).substring(2, 11);
    const surprise: Surprise = {
      ...newSurprise,
      id,
      views: 0,
      createdAt: new Date().toISOString()
    };
    setSurprises((prev) => [surprise, ...prev]);
    return id;
  };

  const updateSurprise = (id: string, updated: Partial<Surprise>) => {
    setSurprises((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const deleteSurprise = (id: string) => {
    setSurprises((prev) => prev.filter((item) => item.id !== id));
  };

  const getSurpriseById = (id: string) => {
    return surprises.find((item) => item.id === id);
  };

  const incrementViews = (id: string) => {
    setSurprises((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...item, views: item.views + 1 } : item))
    );
  };

  return (
    <HeartlyContext.Provider
      value={{ surprises, addSurprise, updateSurprise, deleteSurprise, getSurpriseById, incrementViews }}
    >
      {children}
    </HeartlyContext.Provider>
  );
}

export function useHeartly() {
  const context = useContext(HeartlyContext);
  if (!context) {
    throw new Error('useHeartly must be used within a HeartlyProvider');
  }
  return context;
}
