import { supabase } from './supabaseClient';

export async function broadcastToSlot(slotId: string, event: string, payload: any): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const channelName = `slot:${slotId}`;
      const channel = supabase.channel(channelName);

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            const res = await channel.send({
              type: 'broadcast',
              event,
              payload,
            });
            console.log(`✅ Broadcast '${event}' to '${channelName}' result:`, res);
          } catch (sendErr) {
            console.error(`Send broadcast error for ${event}:`, sendErr);
          } finally {
            setTimeout(() => {
              supabase.removeChannel(channel);
            }, 500);
            resolve();
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn(`Channel subscribe status '${status}' for '${channelName}'`);
          supabase.removeChannel(channel);
          resolve();
        }
      });

      // Fallback safety timeout
      setTimeout(() => {
        resolve();
      }, 2500);
    } catch (error) {
      console.error(`Error broadcasting event ${event} to slot ${slotId}:`, error);
      resolve();
    }
  });
}
