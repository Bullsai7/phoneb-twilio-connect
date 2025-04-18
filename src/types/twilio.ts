
export interface TwilioPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid?: string;
  capabilities?: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  available: boolean;
  locality?: string;
  region?: string;
  isoCountry?: string;
  dateCreated?: string;
}
