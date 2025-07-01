type AsyncFunction<T> = (...args: any[]) => Promise<T>;

export const catchAsync = <T>(fn: AsyncFunction<T>) => {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.debug(error);
      //@ts-ignore
      return { status: "error", message: error };
    }
  };
};
