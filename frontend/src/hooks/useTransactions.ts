import { useQuery } from '@apollo/client';
import { GET_EMPLOYEES } from '@/lib/graphql/users';

interface Employee {
  employee_id: string;
  name: string;
  role: string;
  email: string;
}

export function useEmployees() {
  const { data, loading, error } = useQuery(GET_EMPLOYEES);

  return {
    employees: data?.employees || [],
    loading,
    error,
  };
}