import { ERROR } from "@/shared/constants";
import { SUCCESS } from "@/shared/constants";
import {
  DatabaseAdapter,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  UpdateInArrayOptions,
} from "./types";
import { QueryResult } from "./types";
import { Model, Document } from "mongoose";
import { dbConnect } from "@/lib/mongoose";
import bcrypt from 'bcryptjs';
import { Organisation } from "@/models";

interface MultiQuery {
  action: "find" | "create" | "update" | "delete";
  modelName: string;
  options: FindOptions | CreateOptions | UpdateOptions | DeleteOptions;
}

export class MongooseAdapter implements DatabaseAdapter {
  private models: { [key: string]: Model<Document> };

  /**
   * Example usage:
   * const adapter = new MongooseAdapter({
   *   User: UserModel,
   *   Order: OrderModel,
   *   Product: ProductModel
   * });
   */
  constructor(models: { [key: string]: Model<Document> }) {
    this.models = models;
  }

  /**
   * Find documents with advanced querying options
   *
   * Example usage:
   * const result = await adapter.find('User', {
   *   // Basic filter
   *   filter: { age: { $gt: 18 } },
   *
   *   // Search functionality
   *   searchTerm: "john",
   *   searchFields: ["firstName", "lastName", "email"],
   *
   *   // Get distinct values
   *   distinct: "role",
   *
   *   // Sorting
   *   sort: { createdAt: "desc", lastName: "asc" },
   *
   *   // Field selection
   *   select: ["firstName", "lastName", "email", "role"],
   *
   *   // Populate relations
   *   populate: ["orders", "profile"],
   *
   *   // Pagination
   *   pagination:{
   *   page: 1,
   *   limit: 10
   *   }
   * });
   */
  async find(modelName: string, options: FindOptions): Promise<QueryResult> {
    await dbConnect();
    const model = this.models[modelName];
    if (!model)
      return { status: ERROR, message: `Model ${modelName} not found` };

    let query = model.find(options.filter || {});

    // Search
    if (
      options.searchTerm &&
      options.searchFields &&
      options.searchFields.length > 0
    ) {
      const searchConditions = options.searchFields.map((field) => ({
        [field]: { $regex: options.searchTerm, $options: "i" },
      }));
      query = query.or(searchConditions);
    }

    // Distinct
    if (options.distinct) {
      const distinctValues = await model.distinct(
        options.distinct,
        options.filter
      );
      return {
        status: SUCCESS,
        data: distinctValues,
        pagination: {
          total: distinctValues.length,
          page: 1,
          limit: distinctValues.length,
          pages: 1,
        },
      };
    }

    // Sorting
    if (options.sort) {
      const sortObj: any = {};
      for (const k in options.sort) {
        sortObj[k] = options.sort[k] === "asc" ? 1 : -1;
      }
      query = query.sort(sortObj);
    }

    // Select
    if (options.select && options.select.length > 0) {
      query = query.select(options.select.join(" "));
    }

    // Populate
    if (options.populate && options.populate.length > 0) {
      // If populate options are explicitly given, use them
      options.populate.forEach((p) => {
        query = query.populate(typeof p === 'string' ? { path: p } : p);
      });
    } else {
      // Auto-populate all ref fields
      const modelPaths = model.schema.paths;
      const populateFields = Object.keys(modelPaths)
        .filter(
          (path) => modelPaths[path].options && modelPaths[path].options.ref
        )
        .map((path) => ({ path }));

      if (populateFields.length > 0) {
        query = query.populate(populateFields);
      }
    }

    const countQuery = model.countDocuments(options.filter || {});

    let page = -1;
    let limit = -1;

    if (options.pagination) {
      page = options.pagination.page || 1;
      limit = options.pagination.limit || 10;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const [docs, total]:any = await Promise.all([query.exec(), countQuery]);
    let sanitizedDocs = docs;
if (modelName === 'USER_MASTER') {
   sanitizedDocs = docs.map((doc:any) => {
    const plainDoc = doc.toObject(); // ensure we work with a plain JS object

    const { employmentDetails } = plainDoc;

    return {
      ...plainDoc,
      department: employmentDetails?.department,
      designation: employmentDetails?.designation,
      reportingTo: employmentDetails?.reportingTo,
      role: employmentDetails?.role,
      mobile: employmentDetails?.workMobile,
      extension: employmentDetails?.extension,
      activeLocation: employmentDetails?.activeLocation,
      reportingLocation: employmentDetails?.reportingLocation,
      Organisation: employmentDetails?.organisation,
   
    };
  });

  console.log('Sanitized docs:', sanitizedDocs);
}
    return {
      status: SUCCESS,
      data: sanitizedDocs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new document
   *
   * Example usage:
   * const result = await adapter.create('User', {
   *   bulkInsert:false,
   *   data: {
   *     firstName: "John",
   *     lastName: "Doe",
   *     email: "john@example.com",
   *     age: 25,
   *     role: "user"
   *   }
   * });
   */

  async create(
    modelName: string,
    options: CreateOptions
  ): Promise<QueryResult> {
    await dbConnect();
    const model = this.models[modelName];
    if (!model)
      return { status: ERROR, message: `Model ${modelName} not found` };

    let doc = null;

    if (options.bulkInsert) {
      const inserted: any[] = [];
      const skipped: any[] = [];
      for (const item of options.data) {
        try {
          // Optional: Hash password if present
          if (item.password) {
            const saltRounds = 10;
            item.password = await bcrypt.hash(item.password, saltRounds);
          }

          doc = await model.create(item);
         
          inserted.push(doc);
        } catch (err: any) {
        
          const reason = err.code === 11000
            ? "Duplicate entry"
            : err.message || "Unknown error";

          skipped.push({
            ...item,
            reason,
          });
        }
      }
      return { status: SUCCESS, data: {doc, skipped, inserted} };
      // doc = await model.insertMany(options.data);
    } else {
      if (options.data.password) {
        const saltRounds = 10;
        options.data.password = await bcrypt.hash(options.data.password, saltRounds);
      }

      doc = await model.create(options.data);
      return { status: SUCCESS, data: doc };
    }

    if (!doc) return { status: ERROR, message: "Failed to create document" };

    
  }



  /**
   * Update documents matching a filter
   *
   * Example usage:
   * const result = await adapter.update('User', {
   *   filter: { email: "john@example.com" },
   *   data: {
   *     age: 26,
   *     lastName: "Smith",
   *     lastUpdated: new Date()
   *   }
   * });
   */
  async update(
    modelName: string,
    options: UpdateOptions
  ): Promise<QueryResult> {
    await dbConnect();
    const model = this.models[modelName];
    if (!model)
      return { status: ERROR, message: `Model ${modelName} not found` };

    let doc: any = [];

    if (options.bulkUpdate) {
      // Perform bulk update (updateMany) and wait for it to complete
      const result = await model.updateMany(options.filter || {}, options.data);

      // You can return the result or perform a follow-up query to fetch updated documents
      if (result.modifiedCount === 0) {
        return { status: ERROR, message: "No documents updated" };
      }

      doc.push(result); // result will contain update details, not documents
    } else {
      // Perform single document update (findOneAndUpdate)

      doc = await model.findOneAndUpdate(options.filter || {}, options.data, {
        new: true,
        upsert: options.upsert ?? false,
        runValidators: true,
      });
      if (!doc) return { status: ERROR, message: "Document not found" };
    }

    return { status: SUCCESS, data: doc };
  }

  // {
  //   id: 'user123',
  //   arrayProperty: 'access',
  //   arrayFilter: { accessId: '64ef3f3e...' },
  //   data: { hasAccess: true, permissions: { view: true, create: true } },
  //   addIfNotFound: true,
  // });
  async updateInArray(
    modelName: string,
    options: UpdateInArrayOptions
  ): Promise<QueryResult> {
    await dbConnect();
    const model = this.models[modelName];
    if (!model)
      return { status: ERROR, message: `Model ${modelName} not found` };

    const { id, arrayProperty, arrayFilter, data, addIfNotFound = true, itemMatcher, replaceAll = false } = options;

    // Find the document by ID                                                                                                                                                           
    const document = await model.findById(id);
    if (!document) return { status: ERROR, message: "Document not found" };



    // Check if the array property exists
    let array = (document as any)[arrayProperty];
    if (replaceAll) {
      array = data
    } else {
      if (!Array.isArray(array)) {
        return {
          status: ERROR,
          message: `${arrayProperty} is not an array or does not exist`,
        };
      }

      if (arrayFilter) {
        // Helper function to access nested keys
        const getNestedValue = (obj: any, path: string) => {
          return path.split('.').reduce((o, key) => (o ? o[key] : undefined), obj);
        };

        // Find the index of the array item matching the filter
        const itemIndex = array.findIndex((item: any) =>
          Object.entries(arrayFilter).every(([key, value]) => {
            const itemValue = getNestedValue(item, key);
            if (itemValue && itemValue.toString) {
              return itemValue.toString() === value.toString();
            }
            return itemValue === value;
          })
        );

        // Add or update logic
        if (itemIndex === -1) {
          if (!addIfNotFound) {
            return { status: ERROR, message: "Item not found in the array" };
          }
          array.push({ ...arrayFilter, ...data });
        } else {
          // Update the array item
          array[itemIndex] = {
            ...array[itemIndex],
            ...data,
          };
        }
      } else {
        if (Array.isArray(data)) {
          if (itemMatcher) {
            data.forEach(d => {
              const matchIndex = array.findIndex((doc: { [x: string]: any; }) => doc[itemMatcher] === d[itemMatcher])
              if (matchIndex !== -1) {
                array[matchIndex][itemMatcher] = d
              } else {
                array.push(d);
              }
            })
          }
        } else {
          array.push(data)
        }
      }

    }

    // Save the updated document
    (document as any)[arrayProperty] = array;
    await document.save();

    return { status: SUCCESS, data: document };
  }

  /**
   * Delete documents matching a filter
   *
   * Example usage:
   * const result = await adapter.delete('User', {
   *   filter: {
   *     age: { $lt: 18 },
   *     status: 'inactive'
   *   }
   * });
   */
  async delete(
    modelName: string,
    options: DeleteOptions
  ): Promise<QueryResult> {
    await dbConnect();
    const model = this.models[modelName];
    if (!model)
      return { status: ERROR, message: `Model ${modelName} not found` };

    const result = await model.deleteMany(options.filter || {});
    return {
      status: SUCCESS,
      data: { deletedCount: result.deletedCount },
    };
  }

  /**
   * Run multiple operations in parallel
   *
   * Example usage:
   * const results = await adapter.runMultiple([
   *   {
   *     action: 'find',
   *     modelName: 'User',
   *     options: {
   *       filter: { role: 'admin' },
   *       select: ['email', 'firstName']
   *     }
   *   },
   *   {
   *     action: 'create',
   *     modelName: 'Order',
   *     options: {
   *       data: {
   *         userId: '123',
   *         total: 99.99,
   *         items: ['item1', 'item2']
   *       }
   *     }
   *   },
   *   {
   *     action: 'update',
   *     modelName: 'Product',
   *     options: {
   *       filter: { id: 'prod123' },
   *       data: { stock: 50 }
   *     }
   *   }
   * ]);
   */

  async runMultiple(queries: MultiQuery[]): Promise<QueryResult[]> {
    await dbConnect();
    const results = await Promise.all(
      queries.map(async (q) => {
        switch (q.action) {
          case "find":
            return this.find(q.modelName, q.options as FindOptions);
          case "create":
            return this.create(q.modelName, q.options as CreateOptions);
          case "update":
            return this.update(q.modelName, q.options as UpdateOptions);
          case "delete":
            return this.delete(q.modelName, q.options as DeleteOptions);
          default:
            return { status: ERROR, message: `Unknown action ${q.action}` };
        }
      })
    );

    return results;
  }

}
