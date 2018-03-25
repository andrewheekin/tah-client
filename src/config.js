export default {
  MAX_ATTACHMENT_SIZE: 5000000,
  s3: {
    BUCKET: 'andrewdotcom',
    REGION: 'us-east-1',    
  },
  apiGateway: {
    REGION: 'us-east-1',
    URL: 'https://jfou61llf0.execute-api.us-east-1.amazonaws.com/prod',
  },
  cognito: {
    REGION: 'us-east-1',
    USER_POOL_ID: 'us-east-1_CCXXyDS6N',
    APP_CLIENT_ID: 'r5al9ejos7hiudjsc71jgflbf',
    IDENTITY_POOL_ID: 'us-east-1:a309dc8a-48e6-4f29-bcc8-85a19338ab5b',
  },
};
