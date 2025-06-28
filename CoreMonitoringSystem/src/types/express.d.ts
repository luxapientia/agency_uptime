import { Agency } from '../models/agency.model';

declare global {
  namespace Express {
    export interface Request {
      agency: Agency & {
        _id: string;
        email: string;
        limits: {
          maxSites: number;
        };
      };
    }
  }
} 