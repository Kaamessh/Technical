import { supabase } from '../services/supabaseClient';

export const round2WorkflowsData = [
  {
    title: '🤖 Simple Machine Learning Model Workflow',
    real_steps: [
      '📊 Collect Data',
      '🧹 Clean Data',
      '✂️ Split Dataset',
      '🏋️ Train Model',
      '📐 Evaluate Model',
      '🚀 Deploy Model',
    ],
    distractors: [
      '🎂 Bake a cake',
      '💾 Format computer',
      '✍️ Write a blog post',
    ],
  },
  {
    title: '🖼️ Deep Learning Image Classification Workflow',
    real_steps: [
      '📸 Gather Images',
      '📐 Resize Images',
      '🏷️ Label Images',
      '⚙️ Set Learning Rate',
      '🧠 Train CNN Model',
      '✅ Check Accuracy',
    ],
    distractors: [
      '🎤 Record audio',
      '🎨 Print on canvas',
      '🛒 Buy a camera',
    ],
  },
  {
    title: '💬 Natural Language Processing (NLP) Sentiment Analysis',
    real_steps: [
      '📥 Collect Text Reviews',
      '🛑 Remove Stopwords',
      '🔠 Tokenize Words',
      '🔢 Vectorize Text',
      '🧠 Train Classifier',
      '📈 Predict Sentiment',
    ],
    distractors: [
      '💽 Format hard drive',
      '✏️ Check spelling errors',
      '⚙️ Compile C++ code',
    ],
  },
  {
    title: '📊 Data Science Exploratory Data Analysis (EDA)',
    real_steps: [
      '📦 Import Libraries',
      '📄 Load CSV File',
      '🔍 Check Missing Values',
      '📉 Plot Data Distributions',
      '🧮 Calculate Correlations',
      '📝 Document Insights',
    ],
    distractors: [
      '🎨 Design user interface',
      '💿 Install operating system',
      '📢 Create marketing campaign',
    ],
  },
  {
    title: '🤖 AI Chatbot RAG (Retrieval-Augmented Generation) Workflow',
    real_steps: [
      '📥 Ingest Documents',
      '✂️ Chunk Text',
      '🔢 Generate Embeddings',
      '🗄️ Store in Vector Database',
      '🔍 Query LLM',
      '💬 Generate Response',
    ],
    distractors: [
      '🎬 Animate 3D model',
      '🎛️ Mix sound tracks',
      '📱 Scan QR code',
    ],
  },
  {
    title: '⚙️ Machine Learning Feature Engineering Workflow',
    real_steps: [
      '🎯 Select Raw Features',
      '🚨 Handle Outliers',
      '🪵 Impute Missing Data',
      '🔢 One-Hot Encode Categoricals',
      '⚖️ Scale Numerical Values',
      '🏆 Select Top Features',
    ],
    distractors: [
      '🔑 Change password',
      '🤐 Compress ZIP file',
      '🗺️ Draw a flowchart',
    ],
  },
  {
    title: '🧠 Generative AI Fine-Tuning Workflow',
    real_steps: [
      '📝 Prepare Prompt-Response Pairs',
      '🤖 Load Base LLM',
      '🔤 Tokenize Dataset',
      '🏃 Run Fine-Tuning Script',
      '🤝 Merge Weights',
      '📉 Quantize Model',
    ],
    distractors: [
      '🌐 Connect to Wi-Fi',
      '🖥️ Update graphics driver',
      '💻 Write HTML code',
    ],
  },
  {
    title: '🚀 MLOps Automated Deployment Workflow',
    real_steps: [
      '💻 Commit Model Code',
      '⚙️ Trigger CI/CD Pipeline',
      '🐳 Build Docker Image',
      '🧪 Run Automated Tests',
      '☸️ Deploy to Kubernetes',
      '👁️ Monitor Endpoint Drift',
    ],
    distractors: [
      '🔌 Reboot router',
      '📅 Send calendar invite',
      '🎨 Design company logo',
    ],
  },
  {
    title: '🎯 Recommender System Workflow',
    real_steps: [
      '🖱️ Track User Clicks',
      '🧮 Build Interaction Matrix',
      '👥 Compute User Similarity',
      '🔮 Generate Recommendations',
      '🧹 Filter Viewed Items',
      '🍽️ Serve Recommendations List',
    ],
    distractors: [
      '📊 Format Excel sheet',
      '📧 Verify email address',
      '💾 Defragment disk',
    ],
  },
  {
    title: '🗄️ Data Engineering ETL Pipeline',
    real_steps: [
      '🌐 Extract from API',
      '📐 Validate JSON Schema',
      '🧹 Filter Null Values',
      '📈 Aggregate Daily Metrics',
      '📦 Load into Data Warehouse',
      '🔄 Refresh BI Dashboard',
    ],
    distractors: [
      '🎨 Compile CSS file',
      '🗑️ Empty recycling bin',
      '🔄 Restart local server',
    ],
  },
];

export async function seedRound2() {
  console.log(`Starting to seed ${round2WorkflowsData.length} Round 2 workflow challenges into Supabase...`);

  const { data: events, error: eventsErr } = await supabase.from('events').select('id, name');
  if (eventsErr || !events || events.length === 0) {
    console.error('No events found in database:', eventsErr);
    return;
  }

  for (const event of events) {
    console.log(`\nProcessing event: "${event.name}" (${event.id})`);

    // Fetch existing workflow challenges for this event
    const { data: existing } = await supabase
      .from('workflow_challenges')
      .select('title')
      .eq('event_id', event.id);

    const existingTitles = new Set((existing || []).map((w) => w.title?.trim()?.toLowerCase()));

    const toInsert = round2WorkflowsData
      .filter((w) => !existingTitles.has(w.title.trim().toLowerCase()))
      .map((w) => ({
        event_id: event.id,
        title: w.title,
        image_urls: [...w.real_steps, '__DISTRACTOR__', ...w.distractors],
      }));

    if (toInsert.length === 0) {
      console.log(`All ${round2WorkflowsData.length} workflows already exist in event "${event.name}".`);
      continue;
    }

    console.log(`Inserting ${toInsert.length} new workflow challenges...`);
    const { data: inserted, error: insertErr } = await supabase
      .from('workflow_challenges')
      .insert(toInsert)
      .select('id, title');

    if (insertErr) {
      console.error(`Error inserting workflows into event "${event.name}":`, insertErr);
    } else {
      console.log(`✓ Successfully inserted ${inserted?.length} Round 2 workflow challenges into event "${event.name}"!`);
    }
  }
}

if (require.main === module) {
  seedRound2().catch(console.error);
}
