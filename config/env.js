import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables using the absolute path to the .env file
dotenv.config({ path: join(__dirname, '..', '.env') });
