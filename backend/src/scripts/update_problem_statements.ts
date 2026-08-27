import { supabase } from '../services/supabaseClient';
import crypto from 'crypto';

async function updateProblemStatements() {
  console.log('=== UPDATING ROUND 6 PROBLEM STATEMENTS ===\n');

  const githubLinkText = 'Github link : https://github.com/Dineshprabhu-AI/AI_sprint_Dataset';

  const newProblemStatements = [
    {
      id: crypto.randomUUID(),
      title: 'Online Retail: Customer Purchasing Behavior & Segmentation',
      category: 'E-Commerce & Retail Analytics',
      description: `Predict customer purchasing behavior and identify valuable customer segments from retail transaction data.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: "CDC Diabetes: Diabetes Risk Prediction",
      category: 'Healthcare & Medical AI',
      description: `Predict an individual's diabetes risk using demographic, lifestyle, and health indicators.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Online Retail II: Demand Forecasting & Purchasing Patterns',
      category: 'E-Commerce & Demand Forecasting',
      description: `Analyze 1M+ transactions to forecast demand, identify high-value customers, and detect unusual purchasing patterns.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Adult/Census Income: Income Prediction ($50K+)',
      category: 'Tabular Classification & Socioeconomics',
      description: `Predict whether an individual's annual income exceeds $50,000 based on demographic and employment data.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Bank Marketing: Term-Deposit Subscription Prediction',
      category: 'FinTech & Marketing Analytics',
      description: `Predict whether a customer will subscribe to a bank's term-deposit product based on customer and campaign information.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Student Career Success: Placement Success Prediction',
      category: 'EdTech & Predictive Analytics',
      description: `Predict Student Placement Success...! Using the given student career dataset, analyze the academic performance, technical skills, internships, projects, communication skills, and other career related factors to predict whether a student will be placed or not placed.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Review Dataset: Factors Influencing Movie Ratings',
      category: 'NLP & Sentiment Analysis',
      description: `Analyze Factors Influencing Movie Ratings Using the given IMDB movie review dataset, analyze review length, frequently used words, positive and negative expressions, and textual patterns to identify the factors that influence audience sentiment toward movies. Determine which textual characteristics are most strongly associated with positive and negative reviews.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'App Market Intelligence: High-Performing Mobile Apps Prediction',
      category: 'App Intelligence & Market Ranking',
      description: `Predict and Identify High-Performing Mobile Apps Using the given mobile app discovery dataset, analyze factors such as app category, country, discovery source, collection type, keywords, chart rank, and discovery time to identify the factors that influence an app's visibility and ranking. Develop a machine learning model to predict whether an app is likely to achieve a high chart position, evaluate the model's performance, and identify the key factors that contribute to an app's successful market visibility.\n\n${githubLinkText}`,
    },
    {
      id: crypto.randomUUID(),
      title: 'Amazon Food Review: Customer Sentiment from Product Reviews',
      category: 'NLP & Product Intelligence',
      description: `Predict Customer Sentiment from Product Reviews Using the given Amazon product reviews dataset, analyze factors such as review text, review summary, product rating, helpfulness, and review patterns to identify the factors that determine customer sentiment. Develop an NLP and machine learning model to classify reviews into positive, neutral, or negative sentiment, evaluate the model using suitable performance metrics, and identify the textual features that have the greatest influence on sentiment prediction.\n\n${githubLinkText}`,
    },
  ];

  // Fetch all events
  const { data: events, error: evErr } = await supabase.from('events').select('id, name');
  if (evErr || !events) {
    console.error('Failed to fetch events:', evErr);
    return;
  }

  console.log(`Found ${events.length} events.`);

  for (const event of events) {
    console.log(`Updating problem statements for event: ${event.name} (${event.id})...`);

    // Check if __PROBLEM_STATEMENTS__ exists
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('event_id', event.id)
      .eq('question_text', '__PROBLEM_STATEMENTS__')
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await supabase
        .from('quiz_questions')
        .update({
          options: newProblemStatements,
          correct_index: 0,
        })
        .eq('id', existing.id);

      if (updErr) console.error(`Error updating event ${event.id}:`, updErr);
      else console.log(`Successfully updated __PROBLEM_STATEMENTS__ for event ${event.name}`);
    } else {
      const { error: insErr } = await supabase
        .from('quiz_questions')
        .insert({
          event_id: event.id,
          question_text: '__PROBLEM_STATEMENTS__',
          options: newProblemStatements,
          correct_index: 0,
        });

      if (insErr) console.error(`Error inserting event ${event.id}:`, insErr);
      else console.log(`Successfully inserted __PROBLEM_STATEMENTS__ for event ${event.name}`);
    }
  }

  console.log('\n=== ALL 9 PROBLEM STATEMENTS WITH GITHUB DATASET LINK SAVED SUCCESSFULLY ===');
}

updateProblemStatements()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
