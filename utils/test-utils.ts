export const queryClient = async (
  path: string,
  options?: any,
  base?: string
) => {
  return await fetch((base || 'http://localhost:3000') + path, { ...options });
};
