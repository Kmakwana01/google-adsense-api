import { google } from 'googleapis';

let oauth2ClientInstance = null;

export const getOAuth2Client = () => {
  if (!oauth2ClientInstance) {
    oauth2ClientInstance = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
  return oauth2ClientInstance;
};

export const createAdsenseClient = (authClient) => {
  return google.adsense({
    version: 'v2',
    auth: authClient
  });
};