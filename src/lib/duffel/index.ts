import { config } from '../config';
import { DuffelFlightGateway } from './duffelGateway';
import { MockFlightGateway } from './mockGateway';
import type { FlightGateway } from './types';

let gateway: FlightGateway | null = null;

export function flightGateway(): FlightGateway {
  if (gateway === null) {
    gateway = config.duffel.demoMode ? new MockFlightGateway() : new DuffelFlightGateway();
  }
  return gateway;
}

export * from './types';
