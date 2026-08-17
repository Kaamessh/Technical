import app from './app';

const PORT = process.env.PORT || 5000;

// Prevent calling app.listen when running as a Vercel Serverless Function
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
