export interface OccasionTheme {
  id: string;
  name: string;
  flow: string[];
  colors: {
    bgGradient: string;
    glow: string;
    accent: string;
    primaryBtn: string;
    cardBg: string;
  };
  particles: {
    type: 'balloons' | 'hearts' | 'confetti' | 'tears' | 'bubbles' | 'stars' | 'petals';
    emojis: string[];
  };
  hero: {
    title: string;
    subtitle: string;
    promiseQuestion: string;
    funnyPhrases: string[];
    openingIcon: 'heart' | 'gift' | 'smile' | 'sorry' | 'farewell';
    noButtonText: string;
    heroGreeting: string;
  };
  reveal: {
    title: string;
    subtitle: string;
    effect: 'confetti' | 'hearts' | 'tears' | 'balloons' | 'stars';
    celebrationMessage: string;
    outroButtonText: string;
  };
  // Premium visual upgrades
  typography: {
    fontClass: string;      // e.g. 'font-playfair' or 'font-outfit'
    headingFont: string;    // e.g. 'font-playfair' or 'font-outfit'
  };
  sparkles?: {
    colorClass: string;
    shadowFilter: string;
    count: number;
  };
  ambientOverlayClass?: string;
  motion: {
    transitionType: 'playful' | 'slow-elegant' | 'slow-calm' | 'cinematic' | 'nostalgic';
    stepDuration: number;
    polaroidDuration: number;
  };
  defaultMusic: {
    category: string;
    trackId: string;
  };
  typewriterSpeed: number;
  timelineLabels: string[];
}

export const OCCASION_THEMES: Record<string, OccasionTheme> = {
  birthday: {
    id: 'birthday',
    name: 'Birthday',
    flow: ['intro', 'promise', 'hero', 'memories', 'cake', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-amber-950/25 to-orange-950/15',
      glow: 'glow-amber',
      accent: 'text-amber-400',
      primaryBtn: 'from-amber-500 via-orange-500 to-rose-500',
      cardBg: 'bg-amber-950/10 border-amber-500/10'
    },
    particles: {
      type: 'balloons',
      emojis: ['🎈', '🎉', '🎁', '🎂', '✨']
    },
    hero: {
      title: 'A magical birthday surprise awaits you... 🎂',
      subtitle: 'Turn your sound up and let the celebrations begin!',
      promiseQuestion: "Promise you'll eat a big slice of cake today? 🍰",
      funnyPhrases: [
        "Arey please click yes! 🍰",
        "No cake for you if you click No! 😤",
        "Just click Yes, birthday child! 🎈",
        "Wait, you can't say no today! 🎁",
        "Cake is waiting! 🎂"
      ],
      openingIcon: 'gift',
      noButtonText: 'No 🙄',
      heroGreeting: 'Today is all about you... 🎂✨'
    },
    reveal: {
      title: 'Happy Birthday! 🥳',
      subtitle: 'Wishing you a year filled with laughter, love, and sweet memories. You are celebrated today!',
      effect: 'confetti',
      celebrationMessage: 'Hope your day feels as special as you are ❤️',
      outroButtonText: 'Send Birthday Wishes Back 🎂'
    },
    typography: {
      fontClass: 'font-outfit',
      headingFont: 'font-outfit'
    },
    sparkles: {
      colorClass: 'text-amber-300/35',
      shadowFilter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))',
      count: 15
    },
    ambientOverlayClass: 'bg-radial-gradient from-amber-500/5 via-transparent to-transparent mix-blend-color-dodge animate-pulse-slow',
    motion: {
      transitionType: 'playful',
      stepDuration: 0.6,
      polaroidDuration: 0.4
    },
    defaultMusic: {
      category: 'Birthday',
      trackId: 'bday-h-3'
    },
    typewriterSpeed: 25,
    timelineLabels: ['The birth of memories 🎈', 'A beautiful chapter 📸', 'Another year older! 🎉', 'Sweetest times 🍰']
  },
  anniversary: {
    id: 'anniversary',
    name: 'Anniversary',
    flow: ['intro', 'promise', 'hero', 'memories', 'heart-reveal', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-rose-950/25 to-pink-950/15',
      glow: 'glow-rose',
      accent: 'text-rose-400',
      primaryBtn: 'from-rose-500 via-pink-500 to-amber-500',
      cardBg: 'bg-rose-950/10 border-rose-500/10'
    },
    particles: {
      type: 'hearts',
      emojis: ['❤️', '💖', '🌹', '✨', '💍']
    },
    hero: {
      title: 'Some moments deserve to be remembered forever... ✨',
      subtitle: 'A little journey of us ❤️',
      promiseQuestion: "Promise you'll love me forever? 👉👈",
      funnyPhrases: [
        "Excuse me? Try again! 😤",
        "No is not an option on our day! ❤️",
        "Please say yes? 🥺",
        "I will buy you chocolates! 🍫",
        "Click YES already! 💕"
      ],
      openingIcon: 'heart',
      noButtonText: 'No 🥺',
      heroGreeting: 'Every moment with you matters... ✨'
    },
    reveal: {
      title: 'Happy Anniversary! 🥂',
      subtitle: 'To another year of sharing sunsets, laughter, dreams, and beautiful memories together. Cheers to us! ❤️',
      effect: 'hearts',
      celebrationMessage: 'Still choosing you, every single day... 🥂❤️',
      outroButtonText: 'Send Love Back ❤️'
    },
    typography: {
      fontClass: 'font-playfair',
      headingFont: 'font-playfair'
    },
    sparkles: {
      colorClass: 'text-rose-300/30',
      shadowFilter: 'drop-shadow(0 0 5px rgba(244,63,94,0.5))',
      count: 14
    },
    ambientOverlayClass: 'bg-radial-gradient from-rose-500/8 via-transparent to-transparent pointer-events-none mix-blend-color-dodge animate-pulse-slow',
    motion: {
      transitionType: 'slow-elegant',
      stepDuration: 1.0,
      polaroidDuration: 0.8
    },
    defaultMusic: {
      category: 'Anniversary',
      trackId: 'anniv-h-1'
    },
    typewriterSpeed: 40,
    timelineLabels: ['Where it started 📍', 'Our sweet moments ✨', 'A beautiful chapter 📸', 'Still my favorite person 🥂']
  },
  sorry: {
    id: 'sorry',
    name: 'Sorry',
    flow: ['intro', 'promise', 'hero', 'memories', 'emotional-pause', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-slate-900 to-sky-950/15',
      glow: 'glow-blue',
      accent: 'text-sky-400',
      primaryBtn: 'from-sky-500 to-indigo-500',
      cardBg: 'bg-sky-950/10 border-sky-500/10'
    },
    particles: {
      type: 'tears',
      emojis: ['🥺', '💧', '🩹', '🌱', '🤍']
    },
    hero: {
      title: 'Before you scroll away… 🥹',
      subtitle: 'Just one minute… please ❤️',
      promiseQuestion: 'Can we fix this? 🥹',
      funnyPhrases: [
        "I'm really really sorry! 😭",
        "Please give me a chance? 🥺",
        "Don't be angry, please! 😤",
        "I'll do anything to make it up! 🩹",
        "Please click Yes? 👉👈"
      ],
      openingIcon: 'sorry',
      noButtonText: 'No 💔',
      heroGreeting: 'Before words fall short... 🥹'
    },
    reveal: {
      title: 'I miss us... 🥺',
      subtitle: "I just want to make things right. Let's talk? ❤️",
      effect: 'stars',
      celebrationMessage: "I just want to make things right. Let's talk? ❤️",
      outroButtonText: 'Accept Apology & Reply 🫶'
    },
    typography: {
      fontClass: 'font-playfair',
      headingFont: 'font-playfair'
    },
    sparkles: {
      colorClass: 'text-sky-300/25',
      shadowFilter: 'drop-shadow(0 0 4px rgba(56,189,248,0.4))',
      count: 10
    },
    ambientOverlayClass: 'bg-radial-gradient from-sky-500/4 via-transparent to-transparent pointer-events-none animate-pulse-slow',
    motion: {
      transitionType: 'slow-calm',
      stepDuration: 1.2,
      polaroidDuration: 0.9
    },
    defaultMusic: {
      category: 'Sorry',
      trackId: 'sorry-h-1'
    },
    typewriterSpeed: 45,
    timelineLabels: ['The good old times 📸', 'Happy laughter we shared ✨', 'Remember these moments? 🥹', 'A journey of healing 🩹']
  },
  love: {
    id: 'love',
    name: 'Love',
    flow: ['intro', 'promise', 'hero', 'memories', 'feelings-reveal', 'proposal', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-red-950/20 to-pink-950/15',
      glow: 'glow-pink',
      accent: 'text-pink-400',
      primaryBtn: 'from-pink-500 via-pink-600 to-red-500',
      cardBg: 'bg-pink-950/10 border-pink-500/10'
    },
    particles: {
      type: 'hearts',
      emojis: ['❤️', '💕', '💘', '🌹', '✨']
    },
    hero: {
      title: 'Some feelings deserve more than words ✨',
      subtitle: 'There’s something I wanted to tell you ❤️',
      promiseQuestion: "Promise you'll keep my heart safe? 💖",
      funnyPhrases: [
        "Arey please click yes! 💕",
        "Don't break my heart 💔",
        "I'll make you smile everyday! ✨",
        "Nice try, select Yes! 😉",
        "You light up my world! 🌟"
      ],
      openingIcon: 'heart',
      noButtonText: 'No 🙄',
      heroGreeting: 'Deep inside my heart... ❤️'
    },
    reveal: {
      title: 'Maybe this is just the beginning ❤️',
      subtitle: 'Every moment with you is like a dream. Thank you for being my constant, my smile, and my happiest place. ❤️',
      effect: 'hearts',
      celebrationMessage: 'Every second with you is a dream come true... 🥂❤️',
      outroButtonText: 'Send Love Back ❤️'
    },
    typography: {
      fontClass: 'font-playfair',
      headingFont: 'font-playfair'
    },
    sparkles: {
      colorClass: 'text-pink-300/35',
      shadowFilter: 'drop-shadow(0 0 6px rgba(244,63,94,0.65))',
      count: 16
    },
    ambientOverlayClass: 'bg-radial-gradient from-red-500/6 via-transparent to-transparent pointer-events-none mix-blend-color-dodge animate-pulse-slow',
    motion: {
      transitionType: 'slow-elegant',
      stepDuration: 1.0,
      polaroidDuration: 0.8
    },
    defaultMusic: {
      category: 'Love',
      trackId: 'love-h-1'
    },
    typewriterSpeed: 38,
    timelineLabels: ['Still my favorite memory ❤️', 'Every second with you 🥂', 'A beautiful page of us 📸', 'The moment everything changed ✨']
  },
  friendship: {
    id: 'friendship',
    name: 'Friendship',
    flow: ['intro', 'promise', 'hero', 'memories', 'roast', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-teal-950/20 to-emerald-950/15',
      glow: 'glow-teal',
      accent: 'text-teal-400',
      primaryBtn: 'from-teal-500 via-teal-600 to-emerald-500',
      cardBg: 'bg-teal-950/10 border-teal-500/10'
    },
    particles: {
      type: 'bubbles',
      emojis: ['🤗', '⭐', '🎈', '🍕', '🍻']
    },
    hero: {
      title: 'Warning: emotional + embarrassing memories ahead 😂',
      subtitle: 'Bro… remember these? 😭',
      promiseQuestion: 'Promise we will stay weird forever? 🤪',
      funnyPhrases: [
        "No way you click No! 😤",
        "Weirdos stay together! 🤪",
        "I will leak your funny photos! 📸",
        "Please say Yes, partner in crime! 🍻",
        "Click Yes or buy me pizza! 🍕"
      ],
      openingIcon: 'smile',
      noButtonText: 'No 🙄',
      heroGreeting: 'Best memories with the best idiot... 😂❤️'
    },
    reveal: {
      title: 'To my favorite idiot! 🍻',
      subtitle: 'Thanks for always surviving life with me. Life would be boring without you! 😭❤️',
      effect: 'confetti',
      celebrationMessage: 'Thanks for surviving life with me. Life would be boring without you! 😭❤️',
      outroButtonText: 'Roast Them Back 😂'
    },
    typography: {
      fontClass: 'font-outfit',
      headingFont: 'font-outfit'
    },
    sparkles: {
      colorClass: 'text-teal-300/30',
      shadowFilter: 'drop-shadow(0 0 5px rgba(20,184,166,0.4))',
      count: 12
    },
    ambientOverlayClass: 'bg-radial-gradient from-teal-500/4 via-transparent to-transparent pointer-events-none animate-pulse-slow',
    motion: {
      transitionType: 'playful',
      stepDuration: 0.65,
      polaroidDuration: 0.45
    },
    defaultMusic: {
      category: 'Friendship',
      trackId: 'friend-h-2'
    },
    typewriterSpeed: 20,
    timelineLabels: ['First chaos 😂', 'Peak stupidity 😭', 'A golden chapter 🍕', 'Still friends somehow ❤️']
  },
  farewell: {
    id: 'farewell',
    name: 'Farewell',
    flow: ['intro', 'promise', 'hero', 'memories', 'future-wishes', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-indigo-950/25 to-violet-950/15',
      glow: 'glow-indigo',
      accent: 'text-indigo-400',
      primaryBtn: 'from-indigo-500 via-indigo-600 to-violet-500',
      cardBg: 'bg-indigo-950/10 border-indigo-500/10'
    },
    particles: {
      type: 'stars',
      emojis: ['👋', '✨', '🌍', '💼', '🎓']
    },
    hero: {
      title: 'Some goodbyes deserve more than words ❤️',
      subtitle: 'Before life takes us different ways… 🥹',
      promiseQuestion: "Promise you won't forget us? 🥹",
      funnyPhrases: [
        "Don't forget the fun times! 😭",
        "We will miss you so much! 👋",
        "You have to click Yes! 😤",
        "Keep in touch, okay? 🌍",
        "Say Yes, we'll miss your laugh! ✨"
      ],
      openingIcon: 'farewell',
      noButtonText: 'No 🥺',
      heroGreeting: 'End of a chapter… not the memories ✨'
    },
    reveal: {
      title: 'We will miss you! 🎓',
      subtitle: 'Though paths diverge, the memories we made remain forever. Wishing you all the success, joy, and adventures on your next chapter! 🌟',
      effect: 'stars',
      celebrationMessage: 'Some people stay with us, no matter the distance... ✨❤️',
      outroButtonText: 'Send Good Wishes Back 🌅'
    },
    typography: {
      fontClass: 'font-playfair',
      headingFont: 'font-playfair'
    },
    sparkles: {
      colorClass: 'text-indigo-300/30',
      shadowFilter: 'drop-shadow(0 0 5px rgba(99,102,241,0.5))',
      count: 12
    },
    ambientOverlayClass: 'bg-radial-gradient from-amber-500/4 via-rose-950/8 to-transparent pointer-events-none animate-pulse-slow',
    motion: {
      transitionType: 'nostalgic',
      stepDuration: 0.95,
      polaroidDuration: 0.75
    },
    defaultMusic: {
      category: 'Sorry',
      trackId: 'sorry-e-1'
    },
    typewriterSpeed: 38,
    timelineLabels: ['The best memory 😭', 'Can\'t believe this actually happened ✨', 'The funny times 📸', 'A few memories before goodbye ✨']
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    flow: ['intro', 'promise', 'hero', 'memories', 'letter', 'celebration', 'outro'],
    colors: {
      bgGradient: 'bg-gradient-to-tr from-[#0b0b0c] via-purple-950/20 to-pink-950/10',
      glow: 'glow-purple',
      accent: 'text-brand-purple',
      primaryBtn: 'from-brand-purple to-brand-pink',
      cardBg: 'bg-brand-purple/10 border-brand-purple/10'
    },
    particles: {
      type: 'stars',
      emojis: ['✨', '💖', '🌟', '🎉', '🎁']
    },
    hero: {
      title: 'Someone made something special for you... ❤️',
      subtitle: 'Turn your sound up and open when you\'re ready.',
      promiseQuestion: "Promise you'll smile today? 🥺",
      funnyPhrases: [
        "Arey ek chance to do 🥺",
        "Bas 2 min lagega 😭",
        "No not accepted 😤❤️",
        "Please try again? 👉👈",
        "Nice try, click Yes! 😉"
      ],
      openingIcon: 'heart',
      noButtonText: 'No 🙄',
      heroGreeting: 'This was made specially for...'
    },
    reveal: {
      title: 'A special gift for you! 🎉',
      subtitle: 'We hope this heartfelt digital surprise brings a warm smile to your face. You are truly appreciated! ❤️',
      effect: 'confetti',
      celebrationMessage: 'We hope this surprise brings a warm smile to your face ❤️',
      outroButtonText: 'Create Your Own Surprise ✨'
    },
    typography: {
      fontClass: 'font-outfit',
      headingFont: 'font-heading'
    },
    sparkles: {
      colorClass: 'text-brand-purple/20',
      shadowFilter: 'drop-shadow(0 0 4px rgba(168,85,247,0.3))',
      count: 10
    },
    ambientOverlayClass: 'bg-radial-gradient from-brand-purple/5 to-transparent pointer-events-none animate-pulse-slow',
    motion: {
      transitionType: 'cinematic',
      stepDuration: 0.8,
      polaroidDuration: 0.6
    },
    defaultMusic: {
      category: 'Love',
      trackId: 'love-e-1'
    },
    typewriterSpeed: 30,
    timelineLabels: ['Where it started 📍', 'Our sweet moments ✨', 'A beautiful chapter 📸', 'Still my favorite person 🥂']
  }
};

export function getOccasionTheme(occasionName?: string): OccasionTheme {
  if (!occasionName) return OCCASION_THEMES.custom;
  
  const key = occasionName.trim().toLowerCase();
  
  if (key === 'birthday') return OCCASION_THEMES.birthday;
  if (key === 'anniversary') return OCCASION_THEMES.anniversary;
  if (key === 'sorry') return OCCASION_THEMES.sorry;
  if (key === 'love' || key === 'proposal') return OCCASION_THEMES.love;
  if (key === 'friendship') return OCCASION_THEMES.friendship;
  if (key === 'farewell') return OCCASION_THEMES.farewell;
  
  return OCCASION_THEMES.custom;
}
