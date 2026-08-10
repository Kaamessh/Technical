import { supabase } from './supabaseClient';

export async function broadcastToSlot(slotId: string, event: string, payload: any) {
  try {
    const channel = supabase.channel(`slot:${slotId}`);
    const res = await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
    console.log(`Broadcast ${event} to slot:${slotId} result:`, res);
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error(`Error broadcasting event ${event} to slot ${slotId}:`, error);
  }
}
