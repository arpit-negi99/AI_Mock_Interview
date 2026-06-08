import { useCallback, useState } from 'react';

export function useApi(asyncFn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const response = await asyncFn(...args);
      setData(response);
      setIsSuccess(true);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn]);

  return { data, error, isLoading, isSuccess, execute, setData };
}
