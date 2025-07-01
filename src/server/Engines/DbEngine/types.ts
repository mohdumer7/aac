import { Document } from 'mongoose';

export interface QueryResult {
  status: string;
  message?: string;
  data?: any;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FindOptions {
  filter?: object;
  searchTerm?: string;
  searchFields?: string[];
  distinct?: string;
  sort?: { [key: string]: 'asc' | 'desc' };
  select?: string[];
  populate?: string[] | { path: string; select?: string }[];
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface CreateOptions {
  data: any;
  bulkInsert?: boolean;
}

export interface UpdateOptions {
  filter?: object;
  data: any;
  bulkUpdate?: boolean;
  upsert?: boolean;
}

export interface UpdateInArrayOptions {
  id: string;
  arrayProperty: string;
  arrayFilter?: object;
  data: any;
  addIfNotFound?: boolean;
  itemMatcher?: string;
  replaceAll?: boolean;
}

export interface DeleteOptions {
  filter?: object;
}

export interface DatabaseAdapter {
  find(modelName: string, options: FindOptions): Promise<QueryResult>;
  create(modelName: string, options: CreateOptions): Promise<QueryResult>;
  update(modelName: string, options: UpdateOptions): Promise<QueryResult>;
  updateInArray(modelName: string, options: UpdateInArrayOptions): Promise<QueryResult>;
  delete(modelName: string, options: DeleteOptions): Promise<QueryResult>;
  runMultiple(queries: any[]): Promise<QueryResult[]>;
}