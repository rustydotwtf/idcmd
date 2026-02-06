export const requireResponse = (
  response: Response | undefined,
  message = "Expected response to be defined"
): Response => {
  if (!response) {
    throw new Error(message);
  }

  return response;
};

export const isSorted = (values: string[]): boolean => {
  let previous: string | undefined;

  for (const current of values) {
    if (previous !== undefined && previous > current) {
      return false;
    }
    previous = current;
  }

  return true;
};
