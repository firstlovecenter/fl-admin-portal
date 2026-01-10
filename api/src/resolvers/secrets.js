"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSecrets = void 0;
/* eslint-disable  */
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const dotenv = __importStar(require("dotenv"));
// import dotenv from "dotenv";
dotenv.config();
// Load environment variables from .env file
// Use default value if environment variable is not set
const secret_name = process.env.AWS_SECRET_NAME || 'secret';
console.log('Using AWS Secret Name:', secret_name);
const client = new client_secrets_manager_1.SecretsManagerClient({
    region: 'eu-west-2',
});
const fetchAwsSecret = async () => {
    try {
        console.log('Attempting to fetch AWS Secret...');
        const response = await client.send(new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secret_name,
            VersionStage: 'AWSCURRENT',
        }));
        if (response.SecretString) {
            console.log('Secret successfully retrieved');
            return JSON.parse(response.SecretString);
        }
        throw new Error('Secret string is empty');
    }
    catch (error) {
        console.error('Error fetching secrets from AWS:', error);
        // Fallback to default values if AWS secret fetch fails
        console.log('Using fallback secrets');
        return {
            JWT_SECRET: 'fallback_secret_key_for_development',
            NEO4J_URI: 'bolt://localhost:7687',
            NEO4J_USER: 'neo4j',
            NEO4J_PASSWORD: 'password',
        };
    }
};
const loadSecrets = async () => {
    const secrets = await fetchAwsSecret();
    return secrets;
};
exports.loadSecrets = loadSecrets;
module.exports = { loadSecrets: exports.loadSecrets };
exports.default = exports.loadSecrets;
