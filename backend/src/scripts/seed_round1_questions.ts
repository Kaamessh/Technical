import { supabase } from '../services/supabaseClient';

export const round1QuestionsData = [
  {
    question_text: 'Which technique is mainly used to detect patterns in unlabeled data?',
    options: ['Regression', 'Classification', 'Clustering', 'Reinforcement Learning'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which metric is useful when false positives and false negatives both matter?',
    options: ['MAE', 'R²', 'Variance', 'F1-Score'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which method combines several weak learners to build a stronger model?',
    options: ['PCA', 'Boosting', 'KNN', 'Tokenization'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which step should normally be performed before training when a dataset contains duplicate records?',
    options: ['Model Tuning', 'Prediction', 'Data Cleaning', 'Deployment'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which technique helps a CNN become less sensitive to small changes in feature location?',
    options: ['Tokenization', 'Encoding', 'Regression', 'Pooling'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which activation function is commonly used in hidden layers because it helps reduce vanishing-gradient issues?',
    options: ['Softmax', 'ReLU', 'Sigmoid', 'Linear'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which architecture is designed to handle long-term dependencies in sequential data?',
    options: ['K-Means', 'SVM', 'LSTM', 'PCA'],
    correct_index: 2, // C
  },
  {
    question_text: 'What does a larger Transformer context window primarily allow?',
    options: ['Eliminating hallucinations', 'Reducing model parameters', 'Removing training data', 'Processing more input tokens'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which technique creates additional training examples by modifying existing data?',
    options: ['Data Leakage', 'Feature Selection', 'Data Augmentation', 'Data Encoding'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which statistical measure describes the strength and direction of a linear relationship?',
    options: ['Median', 'Correlation', 'Variance', 'Frequency'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which approach is most suitable for predicting whether a transaction is fraudulent or legitimate?',
    options: ['Classification', 'Clustering', 'Dimensionality Reduction', 'Association Mining'],
    correct_index: 0, // A
  },
  {
    question_text: 'Which technique helps a model handle features measured on different numerical scales?',
    options: ['Tokenization', 'Bagging', 'Pooling', 'Standardization'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which AI field focuses on enabling machines to understand images and videos?',
    options: ['NLP', 'Data Mining', 'Computer Vision', 'Expert Systems'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which NLP technique divides text into smaller units before processing?',
    options: ['Regression', 'Tokenization', 'Clustering', 'Sampling'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which type of AI generates new text, images, audio, or video?',
    options: ['Predictive AI', 'Reactive AI', 'Rule-Based AI', 'Generative AI'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which concept refers to a change in the statistical properties of data after a model is deployed?',
    options: ['Dropout', 'Underfitting', 'Data Drift', 'Encoding'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which AI principle requires an AI system to avoid unfair treatment of different groups?',
    options: ['Scalability', 'Fairness', 'Compression', 'Optimization'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which Indian initiative focuses on developing AI capabilities, infrastructure, and innovation across India?',
    options: ['IndiaAI Mission', 'Make in India', 'Startup India', 'Digital Literacy Mission'],
    correct_index: 0, // A
  },
  {
    question_text: 'Which capability has become increasingly important in recent LLMs, allowing models to perform multiple steps using external tools?',
    options: ['Data Imputation', 'Feature Scaling', 'Agentic AI', 'Image Filtering'],
    correct_index: 2, // C
  },
  {
    question_text: 'Modern AI accelerators such as GPUs are particularly important because they efficiently perform which type of operation used heavily in neural networks?',
    options: ['File Compression', 'Matrix Computations', 'Text Formatting', 'Database Indexing'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which AI approach uses predefined rules to make decisions?',
    options: ['Deep Learning', 'Clustering', 'Rule-Based AI', 'Generative AI'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which data structure is commonly used to store data in rows and columns in Pandas?',
    options: ['Series', 'DataFrame', 'Tensor', 'Tuple'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which operation combines datasets using a common column?',
    options: ['Normalize', 'Encode', 'Sample', 'Merge'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which statistic measures how much values vary from their average?',
    options: ['Median', 'Variance', 'Mode', 'Percentile'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which sampling method gives every member of a population an equal chance of selection?',
    options: ['Cluster Sampling', 'Stratified Sampling', 'Systematic Sampling', 'Simple Random Sampling'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which AI technique is useful for finding frequently occurring item combinations in shopping data?',
    options: ['Regression', 'Image Segmentation', 'Association Rule Mining', 'Reinforcement Learning'],
    correct_index: 2, // C
  },
  {
    question_text: 'In association-rule mining, what does support measure?',
    options: ['Rule accuracy', 'Frequency of an itemset in the dataset', 'Number of classes', 'Model complexity'],
    correct_index: 1, // B
  },
  {
    question_text: 'Which method divides a dataset into smaller groups based on similar characteristics?',
    options: ['Regression', 'Encoding', 'Classification', 'Clustering'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which computer-vision technique assigns a class to each pixel of an image?',
    options: ['Image Classification', 'Object Detection', 'Image Compression', 'Semantic Segmentation'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which technique can help increase the variety of images available for training a vision model?',
    options: ['Data Joining', 'Tokenization', 'Image Rotation', 'Feature Hashing'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which component in a neural network stores adjustable values learned during training?',
    options: ['Labels', 'Classes', 'Samples', 'Weights'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which optimization algorithm adjusts neural-network weights using gradients?',
    options: ['K-Means', 'Gradient Descent', 'Apriori', 'Random Forest'],
    correct_index: 1, // B
  },
  {
    question_text: 'What is the main purpose of a loss function during model training?',
    options: ['Increase dataset size', 'Remove duplicate records', 'Measure prediction error', 'Create new features'],
    correct_index: 2, // C
  },
  {
    question_text: 'Which technique combines information from multiple models to improve prediction?',
    options: ['Ensemble Learning', 'Tokenization', 'Sampling', 'Normalization'],
    correct_index: 0, // A
  },
  {
    question_text: 'Which AI technique can identify important regions in a medical scan for further analysis?',
    options: ['Data Encoding', 'Regression', 'Association Mining', 'Image Segmentation'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which type of database is designed to handle highly connected data such as social-network relationships?',
    options: ['Relational Database', 'Flat File', 'Graph Database', 'Spreadsheet'],
    correct_index: 2, // C
  },
  {
    question_text: "Which concept describes an AI model's ability to perform well on data it has not seen during training?",
    options: ['Memorization', 'Encoding', 'Sampling', 'Generalization'],
    correct_index: 3, // D
  },
  {
    question_text: 'Which AI concept combines multiple data types such as text, images, and audio?',
    options: ['Narrow AI', 'Multimodal AI', 'Rule-Based AI', 'Symbolic Regression'],
    correct_index: 1, // B
  },
  {
    question_text: 'Recent AI systems increasingly use Mixture-of-Experts (MoE) architectures. What is a key idea behind MoE?',
    options: ['Remove all neural-network layers', 'Use only one parameter for every input', 'Activate only selected expert networks for an input', 'Avoid training completely'],
    correct_index: 2, // C
  },
  {
    question_text: "India's IndiaAI Mission includes efforts to make AI computing resources more accessible. Which resource is especially important for large-scale AI training?",
    options: ['Optical Storage', 'Mechanical Storage', 'Analog Circuits', 'AI Compute Infrastructure'],
    correct_index: 3, // D
  },
];

export async function seedRound1() {
  console.log(`Starting to seed ${round1QuestionsData.length} Round 1 quiz questions into Supabase...`);

  const { data: events, error: eventsErr } = await supabase.from('events').select('id, name');
  if (eventsErr || !events || events.length === 0) {
    console.error('No events found in Supabase database:', eventsErr);
    return;
  }

  for (const event of events) {
    console.log(`\nProcessing event: "${event.name}" (ID: ${event.id})`);

    // Fetch existing quiz questions for this event to avoid exact duplicates
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('question_text')
      .eq('event_id', event.id)
      .not('question_text', 'like', '__%');

    const existingSet = new Set((existing || []).map((q) => q.question_text?.trim()?.toLowerCase()));

    const toInsert = round1QuestionsData
      .filter((q) => !existingSet.has(q.question_text.trim().toLowerCase()))
      .map((q) => ({
        event_id: event.id,
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
      }));

    if (toInsert.length === 0) {
      console.log(`All ${round1QuestionsData.length} questions already exist in event "${event.name}".`);
      continue;
    }

    console.log(`Inserting ${toInsert.length} new quiz questions...`);
    const { data: inserted, error: insertErr } = await supabase
      .from('quiz_questions')
      .insert(toInsert)
      .select('id, question_text');

    if (insertErr) {
      console.error(`Error inserting questions into event "${event.name}":`, insertErr);
    } else {
      console.log(`✓ Successfully inserted ${inserted?.length} Round 1 quiz questions into event "${event.name}"!`);
    }
  }
}

if (require.main === module) {
  seedRound1().catch(console.error);
}
