import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import SlugClient from './SlugClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Fetch surprise data
  const { data: dbSurprise } = await supabase
    .from('surprises')
    .select('recipient_name, occasion')
    .eq('surprise_slug', slug)
    .single();
    
  if (!dbSurprise) {
    return {
      title: 'Surprise - Heartly ❤️',
      description: 'A special digital surprise is waiting for you.'
    };
  }

  const recipient = dbSurprise.recipient_name;
  const occasion = dbSurprise.occasion || 'Celebration';

  // Dynamic metadata content based on occasion
  let title = `✨ Someone made something special for you ❤️`;
  let description = `A heartfelt cinematic memory journey is waiting. Open it to feel the love.`;

  if (occasion === 'Birthday') {
    title = `🎂 Someone made a birthday surprise for you ❤️`;
    description = `Open to see the special memories and wishes created just for you!`;
  } else if (occasion === 'Anniversary') {
    title = `❤️ A special memory journey awaits ✨`;
    description = `Celebrate the beautiful moments and love shared over the years.`;
  } else if (occasion === 'Sorry') {
    title = `🥹 Someone wants to say something important…`;
    description = `A heartfelt message is waiting for you. Open to read it.`;
  } else if (occasion === 'Friendship') {
    title = `😂 A friendship memory drop incoming`;
    description = `Get ready for some laughs and sweet memories shared by your friend.`;
  } else if (occasion === 'Farewell') {
    title = `🌅 A heartfelt goodbye message ❤️`;
    description = `Wishing you the best on your next adventure. See your farewell surprise.`;
  } else if (occasion === 'Love' || occasion === 'Proposal') {
    title = `❤️ Someone made something special for you`;
    description = `A romantic cinematic experience awaits. Open to feel the love.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: `/s/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${recipient}'s Surprise`,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/s/${slug}/opengraph-image`]
    }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  
  let initialSurprise = null;
  try {
    const { data: dbSurprise } = await supabase
      .from('surprises')
      .select(`
        id,
        recipient_name,
        relationship_type,
        occasion,
        custom_message,
        selected_theme,
        selected_music,
        status,
        password_lock,
        countdown_enabled,
        countdown_duration,
        midnight_unlock,
        cute_no_button,
        plan_type,
        hidden_ending_url,
        one_last_surprise_enabled,
        one_last_surprise_message,
        one_last_surprise_style,
        one_last_surprise_music_url,
        one_last_surprise_voice_note_url
      `)
      .eq('surprise_slug', slug)
      .single();

    if (dbSurprise) {
      const { data: dbPhotos } = await supabase
        .from('photos')
        .select('id, image_url, caption, sort_order')
        .eq('surprise_id', dbSurprise.id)
        .order('sort_order', { ascending: true });

      const mappedPhotos = (dbPhotos || []).map(p => ({
        id: p.id,
        imageUrl: p.image_url,
        caption: p.caption || ''
      }));

      // Resolve selected music track to public audio URL
      let resolvedMusic = dbSurprise.selected_music || 'bday-h-3';
      try {
        if (resolvedMusic && !resolvedMusic.startsWith('http')) {
          const { data: dbMusic } = await supabase
            .from('music_library')
            .select('audio_url')
            .eq('id', resolvedMusic)
            .maybeSingle();
          if (dbMusic && dbMusic.audio_url) {
            resolvedMusic = dbMusic.audio_url;
          }
        }
      } catch (err) {
        console.warn('Could not resolve selected_music via database:', err);
      }

      initialSurprise = {
        id: dbSurprise.id,
        recipientName: dbSurprise.recipient_name,
        occasion: dbSurprise.occasion || 'Celebration',
        relationship: dbSurprise.relationship_type || 'Special Someone',
        message: dbSurprise.custom_message || '',
        music: resolvedMusic,
        theme: dbSurprise.selected_theme || 'dreamy',
        cuteNoButton: dbSurprise.cute_no_button,
        planType: dbSurprise.plan_type || 'Free',
        hiddenEndingUrl: dbSurprise.hidden_ending_url,
        passwordLock: dbSurprise.password_lock,
        countdownEnabled: dbSurprise.countdown_enabled,
        countdownDuration: dbSurprise.countdown_duration,
        status: dbSurprise.status,
        memories: mappedPhotos,
        olsEnabled: dbSurprise.one_last_surprise_enabled,
        olsMessage: dbSurprise.one_last_surprise_message,
        olsStyle: dbSurprise.one_last_surprise_style || 'auto',
        olsMusicUrl: dbSurprise.one_last_surprise_music_url,
        olsVoiceNoteUrl: dbSurprise.one_last_surprise_voice_note_url
      };
    }
  } catch (err) {
    console.error('Server-side fetch error for surprise:', err);
  }

  return <SlugClient slug={slug} initialSurprise={initialSurprise} />;
}
