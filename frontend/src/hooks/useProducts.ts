import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/productService';

export function useProducts(category?: string, page: number = 1) {
  return useQuery({
    queryKey: ['products', category, page],
    queryFn: () => productService.list({ category: category || undefined, page }),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useProductSearch(query: string, category?: string) {
  return useQuery({
    queryKey: ['products-search', query, category],
    queryFn: () => productService.search(query, category),
    enabled: query.length > 0,
  });
}
