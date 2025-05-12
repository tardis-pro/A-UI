import { useState, useCallback } from 'react';
import { store } from '../state/store';
import { setError } from '../state/slices/apiSlice';

interface OptimisticUpdateOptions<T> {
    // The function that performs the actual API call
    apiCall: () => Promise<T>;
    // Function to update local state optimistically
    optimisticUpdate: () => void;
    // Function to revert optimistic update on failure
    rollback: () => void;
    // Key for tracking error state
    errorKey: string;
}

export function useOptimisticUpdate<T>() {
    const [isLoading, setIsLoading] = useState(false);

    const execute = useCallback(async ({
        apiCall,
        optimisticUpdate,
        rollback,
        errorKey,
    }: OptimisticUpdateOptions<T>): Promise<T | undefined> => {
        setIsLoading(true);
        store.dispatch(setError({ key: errorKey, error: null }));

        try {
            // Perform optimistic update
            optimisticUpdate();

            // Make the actual API call
            const result = await apiCall();

            setIsLoading(false);
            return result;
        } catch (error) {
            // Rollback on failure
            rollback();

            // Set error state
            store.dispatch(setError({
                key: errorKey,
                error: error instanceof Error ? error.message : 'An error occurred'
            }));

            setIsLoading(false);
            return undefined;
        }
    }, []);

    return {
        execute,
        isLoading
    };
}

// Example usage:
/*
const Component = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const optimisticUpdate = useOptimisticUpdate<Message>();

  const sendMessage = async (content: string) => {
    const tempId = Date.now().toString();
    const tempMessage = { id: tempId, content, status: 'sending' };

    await optimisticUpdate.execute({
      apiCall: () => api.sendMessage(content),
      optimisticUpdate: () => {
        setMessages(prev => [...prev, tempMessage]);
      },
      rollback: () => {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      },
      errorKey: 'sendMessage'
    });
  };
};
*/