import { useQuery } from '@tanstack/react-query';
import { qrRepository } from '@/repositories/qr.repository';
import { queryKeys } from './queryKeys';

export const useMyQrToken = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.qr.myToken,
    queryFn: qrRepository.issueMyToken,
    enabled,
  });
