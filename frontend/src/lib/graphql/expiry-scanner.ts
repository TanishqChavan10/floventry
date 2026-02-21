import { gql } from '@apollo/client';

export const GET_EXPIRY_SCAN_STATUS = gql`
  query GetExpiryScanStatus {
    expiryScanStatus {
      enabled
      jobRegistered
      jobName
      timeZone
      cronExpression
      nextRunAt
      lastRunAt
      lastSuccessAt
      lastErrorAt
      lastErrorMessage
    }
  }
`;

export const TRIGGER_EXPIRY_SCAN = gql`
  mutation TriggerExpiryScan {
    triggerExpiryScan {
      success
      lotsScanned
      message
    }
  }
`;
