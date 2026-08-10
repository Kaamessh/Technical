import { supabase } from './supabaseClient';

export async function broadcastToSlot(slotId: string, event: string, payload: any) {
  try {
    const channel = supabase.channel(`slot:${slotId}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event,
          payload,
        });
        supabase.removeChannel(channel);
      }
    });
  } catch (error) {
    console.error(`Error broadcasting event ${event} to slot ${slotId}:`, error);
  }
}
