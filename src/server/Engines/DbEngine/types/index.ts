export interface Condition {
    field?: string;
    operator?: string;
    value?: any;
    and?: boolean;
    or?: boolean;
  }
  
  export interface DSLQuery {
    model: string;
    database: string;
    action?: 'find' | 'create' | 'update' | 'delete';
    conditions?: Condition[];
    data?: any;
    select?: string[];
    sort?: { [key: string]: 'asc' | 'desc' };
    page?: number;
    limit?: number;
    distinct?: string;
    searchTerm?: string;
    searchFields?: string[];
    populate?: string[];
    stepName?: string; // For pipeline steps
  }
  
  export interface QueryResult {
    status: string;
    data?: any;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    message?: string;
  }

  export interface FindOptions {
    filter?: any;
    db:string;
    select?: string[];
    sort?: { [key: string]: 'asc' | 'desc' };
    pagination?:
    {
      limit?: number;
      page?: number;
    }
    distinct?: string;
    searchTerm?: string;
    searchFields?: string[];
    populate?: string[];
    lean?: boolean;
  }
  
  export interface CreateOptions {
    data: any;
    bulkInsert:boolean;
  }
  
  export interface UpdateOptions {
    filter?: any;
    data: any;
    bulkUpdate?:boolean
    upsert?:boolean
  }

  export interface UpdateInArrayOptions {
    id: string;
    arrayProperty: string;
    arrayFilter: object;
    data: object;
    addIfNotFound?: boolean;
    itemMatcher?:string;
    replaceAll?:boolean;
  }
  
  export interface DeleteOptions {
    filter?: any;
  }
  
  export interface DatabaseAdapter {
    find(modelName: string, options: FindOptions): Promise<QueryResult>;
    create(modelName: string, options: CreateOptions): Promise<QueryResult>;
    update(modelName: string, options: UpdateOptions): Promise<QueryResult>;
    delete(modelName: string, options: DeleteOptions): Promise<QueryResult>;
  }
  