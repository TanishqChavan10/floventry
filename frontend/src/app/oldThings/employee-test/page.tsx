'use client';

import { useEffect } from 'react';
import { useEmployees } from '@/hooks/useTransactions';

export default function EmployeeTest() {
  const { employees, loading, error } = useEmployees();

  useEffect(() => {
    console.log('Employee test component:');
    console.log('Employees:', employees);
    console.log('Loading:', loading);
    console.log('Error:', error ? error.message : 'No error');
  }, [employees, loading, error]);

  if (loading) return <div>Loading employees...</div>;
  if (error) return <div>Error loading employees: {error.message}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Employee Test</h2>
      <p className="mb-2">Total employees: {employees.length}</p>

      {employees.length === 0 ? (
        <p className="text-red-500">No employees found!</p>
      ) : (
        <ul className="list-disc pl-5">
          {employees.map((employee: any) => (
            <li key={employee.employee_id} className="mb-1">
              ID: {employee.employee_id}, Name: {employee.name}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Information:</h3>
        <pre className="whitespace-pre-wrap text-xs">
          {JSON.stringify({ employees, loading, error }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
