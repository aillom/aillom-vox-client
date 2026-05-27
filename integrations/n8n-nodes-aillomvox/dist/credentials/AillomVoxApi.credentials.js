"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AillomVoxApi = void 0;
class AillomVoxApi {
    constructor() {
        this.name = 'aillomVoxApi';
        this.displayName = 'AillomVox API';
        this.documentationUrl = 'https://vox.aillom.com/docs';
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'x-api-key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/health',
                method: 'GET',
            },
        };
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'Your AillomVox API Key (starts with av_...)',
            },
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'https://vox.aillom.com',
                description: 'AillomVox server URL (if using self-hosted)',
            },
        ];
    }
}
exports.AillomVoxApi = AillomVoxApi;
