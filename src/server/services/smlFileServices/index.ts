// server/services/fileServices/index.ts
import { crudManager } from "@/server/managers/crudManager";
import { catchAsync } from "@/server/shared/catchAsync";

export const createFileData = catchAsync(async (options: any) => {
  const result = await crudManager.mongooose.create(options.db, options);
  return result;
});
