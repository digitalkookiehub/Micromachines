import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';

export function useOrders(page: number = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderService.list(page),
  });
}

export function useOrder(orderId: number) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getById(orderId),
    enabled: orderId > 0,
  });
}
