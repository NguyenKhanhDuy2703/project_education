import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { labApi } from '@/features/lab/api/lab.api';
import type { SubmitLabPayload, SubmitLabResult } from '@/types/lab.types';

export interface UseLabSubmissionProps {
  labId: string | undefined;
}

export interface UseLabSubmissionReturn {
  isSubmitting: boolean;
  submitError: Error | null;
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  submitAttempt: (payload: SubmitLabPayload) => Promise<SubmitLabResult>;
}

export function useLabSubmission({ labId }: UseLabSubmissionProps): UseLabSubmissionReturn {
  const qc = useQueryClient();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const mutation = useMutation({
    mutationFn: (payload: SubmitLabPayload) => {
      if (!labId) throw new Error('Cannot submit: Lab ID is missing');
      return labApi.submit(labId, payload);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['lab-submissions', labId] });
      qc.invalidateQueries({ queryKey: ['series'] });
      if (result.status === 'passed') {
        setShowSuccessModal(true);
      }
    },
  });

  const submitAttempt = useCallback(
    async (payload: SubmitLabPayload) => {
      return mutation.mutateAsync(payload);
    },
    [mutation],
  );

  return {
    isSubmitting: mutation.isPending,
    submitError: mutation.error as Error | null,
    showSuccessModal,
    setShowSuccessModal,
    submitAttempt,
  };
}
