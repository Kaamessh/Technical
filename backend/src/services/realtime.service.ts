import { supabase } from './supabaseClient.js';

export async function broadcastToSlot(slotId: string, event: string, payload: any) {
  try {
    const channel = supabase.channel(`slot:${slotId}`);
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } catch (error) {
    console.error(`Error broadcasting event ${event} to slot ${slotId}:`, error);
  }
}
