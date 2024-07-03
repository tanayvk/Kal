import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const { AWS_REGION } = process.env;
const client = new SecretsManagerClient({ region: AWS_REGION });

let secrets: Record<string, Record<string, any>> = {};

const getSecret = async (key: string): Promise<Record<string, any>> => {
  if (secrets[key]) {
    return secrets[key];
  }
  const params = { SecretId: key };
  try {
    const command = new GetSecretValueCommand(params);
    const response = await client.send(command);
    const secretValue = JSON.parse(response.SecretString || "{}");
    secrets[key] = secretValue;
    return secretValue;
  } catch (error) {
    console.error("Error retrieving secret:", error);
    return {};
  }
};

type SMTPCredentials = {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};
export const getSMTPCredentials = async (): Promise<SMTPCredentials> => {
  // TODO: name the secret better with namespacing?
  const credentials = await getSecret("smtp");
  return {
    from: credentials.FROM,
    host: credentials.HOST,
    port: credentials.PORT,
    secure: !!credentials.SECURE,
    auth: {
      user: credentials.USER,
      pass: credentials.PASS,
    },
  };
};
