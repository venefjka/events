import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qrRepository } from '@/repositories/qr.repository';
import type { ScanAttendanceRequest } from '@/types/requests';
import { invalidateActivityData } from './invalidate';

export const useScanAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, payload }: { activityId: string; payload: ScanAttendanceRequest }) =>
      qrRepository.scanAttendance(activityId, payload),
    onSuccess: (_data, variables) => invalidateActivityData(queryClient, variables.activityId),
  });
};
