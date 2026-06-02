import { hc } from 'hono/client';
import { AppType } from '../api/[[...route]]/route';

export const client = hc<AppType>(typeof window === 'undefined' ? 'http://localhost:3000' : '');