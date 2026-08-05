import bcrypt from 'bcrypt';
import { supabase } from '../services/supabaseClient';

async function seed() {
  console.log('🌱 Starting Database Seed Process...');

  // 1. Seed Admin Kaamesh
  const adminEmail = 'kaamesh712006@gmail.com';
  const adminUsername = 'Kaamesh';
  const adminPassword = 'palanivelmangai';

  const password_hash = await bcrypt.hash(adminPassword, 10);

  const { data: existingAdmin } = await supabase
    .from('admins')
    .select('id')
    .eq('email', adminEmail)
    .single();

  let adminId = existingAdmin?.id;

  if (!existingAdmin) {
    const { data: newAdmin, error: adminErr } = await supabase
      .from('admins')
      .insert({
        username: adminUsername,
        email: adminEmail,
        password_hash,
      })
      .select()
      .single();

    if (adminErr) {
      console.error('Error seeding admin:', adminErr.message);
    } else {
      adminId = newAdmin.id;
      console.log(`✅ Admin Created: Username '${adminUsername}', Email '${adminEmail}', Password '${adminPassword}'`);
    }
  } else {
    await supabase.from('admins').update({ password_hash }).eq('email', adminEmail);
    console.log(`ℹ️ Admin '${adminUsername}' (${adminEmail}) updated with password '${adminPassword}'.`);
  }

  // 2. Create Sample Event
  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('name', 'Grand Cyber Championship 2026')
    .single();

  let eventId = existingEvent?.id;

  if (!existingEvent && adminId) {
    const { data: newEvent, error: eventErr } = await supabase
      .from('events')
      .insert({
        name: 'Grand Cyber Championship 2026',
        description: 'Multi-round live competitive event featuring quiz, image, workflow, and binary decode challenges.',
        status: 'active',
        created_by: adminId,
      })
      .select()
      .single();

    if (!eventErr && newEvent) {
      eventId = newEvent.id;
      console.log(`✅ Active Event Created: '${newEvent.name}' (ID: ${eventId})`);
    }
  }

  if (eventId) {
    // 3. Create Sample Slot
    const { data: existingSlot } = await supabase
      .from('slots')
      .select('id, slot_code')
      .eq('event_id', eventId)
      .eq('slot_code', 'SLOT-101')
      .single();

    if (!existingSlot) {
      const { data: newSlot } = await supabase
        .from('slots')
        .insert({
          event_id: eventId,
          slot_number: 1,
          slot_code: 'SLOT-101',
          status: 'open',
          current_round: 1,
        })
        .select()
        .single();

      if (newSlot) {
        console.log(`✅ Slot Created: Slot Code '${newSlot.slot_code}' (ID: ${newSlot.id})`);
      }
    } else {
      console.log(`ℹ️ Slot '${existingSlot.slot_code}' already exists.`);
    }

    // 4. Seed Round 1 Quiz Questions
    const quizSamples = [
      {
        event_id: eventId,
        question_text: 'What is the primary function of Supabase Realtime?',
        options: ['Static File Hosting', 'Postgres Change & Broadcast Subscriptions', 'CSS Styling Engine', 'REST API Caching'],
        correct_index: 1,
      },
      {
        event_id: eventId,
        question_text: 'Which HTTP header is standard for JWT authorization tokens?',
        options: ['X-Auth-Token', 'Authorization: Bearer <token>', 'Cookie: session_id', 'User-Agent'],
        correct_index: 1,
      },
      {
        event_id: eventId,
        question_text: 'In binary notation, what decimal number does "1111" represent?',
        options: ['7', '12', '15', '31'],
        correct_index: 2,
      },
    ];

    await supabase.from('quiz_questions').insert(quizSamples);
    console.log('✅ Round 1 Quiz Questions Seeded.');

    // 5. Seed Round 2 Workflow Challenge
    const workflowSample = {
      event_id: eventId,
      title: 'CI/CD Pipeline Sequence',
      image_urls: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80',
      ],
    };
    await supabase.from('workflow_challenges').insert(workflowSample);
    console.log('✅ Round 2 Workflow Challenge Seeded.');

    // 6. Seed Round 3 AI vs Real Challenge
    const aiOrRealSample = {
      event_id: eventId,
      image_a_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
      image_b_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
      correct_side: 'A',
    };
    await supabase.from('ai_or_real_challenges').insert(aiOrRealSample);
    console.log('✅ Round 3 AI vs Real Challenge Seeded.');

    // 7. Seed Round 4 Data Challenge
    const dataSample = {
      event_id: eventId,
      question_text: 'Spot the anomaly: In a server cluster, continuous CPU utilization jumps to 100% every hour at 00:00:00 without increased incoming web requests. What is the most likely cause?',
      options: ['DDoS Attack', 'Scheduled Cron Job / Backup Script', 'Hardware Memory Leak', 'DNS Resolution Timeout'],
      correct_index: 1,
    };
    await supabase.from('data_challenge_questions').insert(dataSample);
    console.log('✅ Round 4 Data Challenge Question Seeded.');
  }

  console.log('🚀 Seed Completed Successfully!');
}

seed().catch((err) => {
  console.error('Seed Error:', err);
});
