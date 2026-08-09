import { ImageResponse } from 'next/og';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export const alt = 'Heartly Surprise Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface ThemeConfig {
  gradient: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
}

const getOGTheme = (occasion: string): ThemeConfig => {
  switch (occasion) {
    case 'Birthday':
      return {
        gradient: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #701a75 100%)',
        emoji: '🎂',
        badgeBg: 'rgba(236, 72, 153, 0.15)',
        badgeText: '#f472b6',
      };
    case 'Anniversary':
      return {
        gradient: 'linear-gradient(135deg, #881337 0%, #1e1b4b 50%, #4c0519 100%)',
        emoji: '❤️',
        badgeBg: 'rgba(244, 63, 94, 0.15)',
        badgeText: '#fb7185',
      };
    case 'Sorry':
      return {
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)',
        emoji: '🥹',
        badgeBg: 'rgba(129, 140, 248, 0.15)',
        badgeText: '#818cf8',
      };
    case 'Friendship':
      return {
        gradient: 'linear-gradient(135deg, #7c2d12 0%, #18181b 50%, #451a03 100%)',
        emoji: '😂',
        badgeBg: 'rgba(251, 146, 60, 0.15)',
        badgeText: '#fb923c',
      };
    case 'Farewell':
      return {
        gradient: 'linear-gradient(135deg, #581c87 0%, #18181b 50%, #7c2d12 100%)',
        emoji: '🌅',
        badgeBg: 'rgba(244, 63, 94, 0.15)',
        badgeText: '#fb7185',
      };
    case 'Love':
    case 'Proposal':
      return {
        gradient: 'linear-gradient(135deg, #9f1239 0%, #18181b 50%, #be123c 100%)',
        emoji: '🌹',
        badgeBg: 'rgba(244, 63, 94, 0.2)',
        badgeText: '#fda4af',
      };
    default:
      return {
        gradient: 'linear-gradient(135deg, #180828 0%, #090214 50%, #2a0b3f 100%)',
        emoji: '✨',
        badgeBg: 'rgba(168, 85, 247, 0.15)',
        badgeText: '#c084fc',
      };
  }
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch surprise recipient & occasion details
  const { data: dbSurprise } = await supabase
    .from('surprises')
    .select('recipient_name, occasion')
    .eq('surprise_slug', slug)
    .single();

  const recipient = dbSurprise?.recipient_name || 'Someone Special';
  const occasion = dbSurprise?.occasion || 'Celebration';
  const theme = getOGTheme(occasion);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.gradient,
          padding: '40px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Floating sparkles */}
        <span style={{ position: 'absolute', top: '15%', right: '20%', fontSize: '24px', opacity: 0.4 }}>✨</span>
        <span style={{ position: 'absolute', bottom: '25%', left: '15%', fontSize: '20px', opacity: 0.3 }}>✨</span>

        {/* Central glowing glassmorphic card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '60px 80px',
            width: '90%',
            maxWidth: '960px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}
        >
          {/* Occasion Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: theme.badgeBg,
              border: `1px solid rgba(255, 255, 255, 0.05)`,
              borderRadius: '999px',
              padding: '8px 20px',
              marginBottom: '32px',
            }}
          >
            <span style={{ fontSize: '22px', marginRight: '8px' }}>{theme.emoji}</span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: theme.badgeText,
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {occasion} Surprise
            </span>
          </div>

          {/* Recipient Greeting */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                color: '#94a3b8',
                fontWeight: 500,
                marginBottom: '12px',
                letterSpacing: '1px',
              }}
            >
              A special cinematic memory journey awaits
            </span>
            <span
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: '1.2',
                marginBottom: '20px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              {recipient} ❤️
            </span>
            <span
              style={{
                fontSize: '16px',
                color: '#64748b',
                fontWeight: 400,
                maxWidth: '600px',
              }}
            >
              Click to unlock the emotional surprise, beautiful memories, and custom music notes created just for you.
            </span>
          </div>
        </div>

        {/* Elegant Subtle Watermark Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
          }}
        >
          <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>Made with </span>
          <span style={{ fontSize: '15px', color: '#f43f5e', fontWeight: 700, margin: '0 5px' }}>Heartly</span>
          <span style={{ fontSize: '14px', color: '#64748b' }}> • heartly.in</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
