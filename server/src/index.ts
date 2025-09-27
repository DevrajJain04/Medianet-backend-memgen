import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import proxyRouter from './routes/proxy';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/proxy', proxyRouter);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || '';

async function start() {
  if (!MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('Missing MONGO_URI in environment');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(MONGO_URI, {
      // Additional options for better connection handling
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', error);
    
    // Try alternative connection without SSL for local development
    try {
      // eslint-disable-next-line no-console
      console.log('Attempting connection without SSL...');
      await mongoose.connect('mongodb://localhost:27017/aivolution');
      // eslint-disable-next-line no-console
      console.log('Connected to local MongoDB successfully');
    } catch (localError) {
      // eslint-disable-next-line no-console
      console.error('Local MongoDB connection also failed:', localError);
      // Continue without database for now - the proxy endpoints don't require DB
      // eslint-disable-next-line no-console
      console.log('Continuing without database connection...');
    }
  }
  
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});


