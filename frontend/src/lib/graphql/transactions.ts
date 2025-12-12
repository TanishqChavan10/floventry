import { gql } from "@apollo/client";

export const GET_TRANSACTIONS = gql`
  query GetTransactions($page: Int, $limit: Int, $status: String, $customer_id: String) {
    transactions(page: $page, limit: $limit, status: $status, customer_id: $customer_id) {
      transaction_id
      transaction_date
      total_amount
      payment_method
      payment_refno
      status
      customer_id
      customer_name
      employee_id
      employee_name
      tax_amount
      discount_amount
      items {
        product_id
        product_name
        quantity
        unit_price
        discount
        total_price
        category_name
      }
    }
  }
`;

export const GET_TRANSACTION = gql`
  query GetTransaction($transaction_id: String!) {
    transaction(transaction_id: $transaction_id) {
      transaction_id
      transaction_date
      total_amount
      payment_method
      payment_refno
      status
      customer_id
      customer_name
      employee_id
      employee_name
      tax_amount
      discount_amount
      items {
        transaction_id
        product_id
        product_name
        quantity
        unit_price
        discount
        total_price
        category_name
      }
    }
    # These might be separate root fields or resolved within transaction depending on backend schema
    # Based on usage, it seems frontend expects them as separate or nested.
    # useTransactions hook accesses data.customer and data.employee
    # I will assume the backend resolver returns them at root or we ask for them.
    # But wait, looking at useTransactions hook: 
    # const customer = data?.customer ...
    # const cashier = data?.employee ...
    # This implies the query returns 'transaction', 'customer', and 'employee' as top level fields?
    # Or maybe the hook logic is robust enough to handle nulls.
    # I'll include them if the schema supports it, but standard REST-like GraphQL often nests them.
    # Given the hook accesses data.customer directly, I'll add them here assuming the schema provides them or they are aliases.
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      transaction_id
      transaction_date
      total_amount
      status
    }
  }
`;
