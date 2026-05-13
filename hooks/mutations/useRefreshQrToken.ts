import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qrRepository } from '@/repositories/qr.repository';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const useRefreshQrToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: qrRepository.issueMyToken,
    onSuccess: (token) => queryClient.setQueryData(queryKeys.qr.myToken, token),
  });
};
