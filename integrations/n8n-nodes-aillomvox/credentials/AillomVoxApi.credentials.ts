import {
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class AillomVoxApi implements ICredentialType {
    name = 'aillomVoxApi';
    displayName = 'AillomVox API';
    documentationUrl = 'https://vox.aillom.com/docs';
    authenticate = {
        type: 'generic' as const,
        properties: {
            headers: {
                'x-api-key': '={{$credentials.apiKey}}',
            },
        },
    };
    test = {
        request: {
            baseURL: '={{$credentials.baseUrl}}',
            url: '/health',
            method: 'GET' as const,
        },
    };
    properties: INodeProperties[] = [
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
