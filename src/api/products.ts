import api from './axiosInstance';
import type { ApiResponse, Product, ProductCategory } from '../types';

export const getProducts = async (categoryId?: string) => {
  const res = await api.get<ApiResponse<Product[]>>('/products', { params: { categoryId } });
  return res.data.data;
};

export const getCategories = async () => {
  const res = await api.get<ApiResponse<ProductCategory[]>>('/products/categories');
  return res.data.data;
};

export const createProduct = async (data: {
  categoryId: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
}) => {
  const res = await api.post<ApiResponse<Product>>('/products', data);
  return res.data.data;
};

export const updateProduct = async (id: string, data: {
  categoryId: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}) => {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};
