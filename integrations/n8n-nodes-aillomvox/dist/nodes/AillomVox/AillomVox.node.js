"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AillomVox = void 0;
class AillomVox {
    constructor() {
        this.description = {
            displayName: 'AillomVox',
            name: 'aillomVox',
            icon: 'file:aillomvox.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Interact with AillomVox API (Voices, Providers, Recordings)',
            defaults: {
                name: 'AillomVox',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'aillomVoxApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Info',
                            value: 'info',
                        },
                        {
                            name: 'Recording',
                            value: 'recording',
                        },
                    ],
                    default: 'info',
                },
                // ----------------------------------
                //         Resource: Info
                // ----------------------------------
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                'info',
                            ],
                        },
                    },
                    options: [
                        {
                            name: 'Get Voices',
                            value: 'getVoices',
                            description: 'Returns the list of available voices',
                            action: 'Get voices',
                        },
                        {
                            name: 'Get Providers',
                            value: 'getProviders',
                            description: 'Returns the list of AI providers and pricing',
                            action: 'Get providers',
                        },
                    ],
                    default: 'getVoices',
                },
                // ----------------------------------
                //         Resource: Recording
                // ----------------------------------
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: [
                                'recording',
                            ],
                        },
                    },
                    options: [
                        {
                            name: 'Get Download URL',
                            value: 'getDownloadUrl',
                            description: 'Generates a temporary link to download the recording',
                            action: 'Get download url',
                        },
                    ],
                    default: 'getDownloadUrl',
                },
                // ----------------------------------
                //         Fields: getVoices
                // ----------------------------------
                {
                    displayName: 'Provider (Optional)',
                    name: 'provider',
                    type: 'options',
                    displayOptions: {
                        show: {
                            resource: [
                                'info',
                            ],
                            operation: [
                                'getVoices',
                            ],
                        },
                    },
                    options: [
                        {
                            name: 'AillomVox (Default)',
                            value: 'aillomvox',
                        },
                        {
                            name: 'ElevenLabs',
                            value: 'elevenlabs',
                        },
                        {
                            name: 'PlayHT',
                            value: 'playht',
                        },
                        {
                            name: 'Inworld',
                            value: 'inworld',
                        },
                        {
                            name: 'Azure',
                            value: 'azure',
                        },
                    ],
                    default: 'aillomvox',
                    description: 'Filter voices by specific provider',
                },
                // ----------------------------------
                //         Fields: getDownloadUrl
                // ----------------------------------
                {
                    displayName: 'Recording ID',
                    name: 'recordingId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: [
                                'recording',
                            ],
                            operation: [
                                'getDownloadUrl',
                            ],
                        },
                    },
                    description: 'The recording ID (UUID) or the S3/Supabase file path',
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'info') {
                    if (operation === 'getVoices') {
                        const provider = this.getNodeParameter('provider', i);
                        const qs = {};
                        if (provider) {
                            qs.provider = provider;
                        }
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: '/api/voices',
                            qs,
                            json: true,
                        });
                        returnData.push(response);
                    }
                    else if (operation === 'getProviders') {
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: '/api/providers',
                            json: true,
                        });
                        returnData.push(response);
                    }
                }
                else if (resource === 'recording') {
                    if (operation === 'getDownloadUrl') {
                        const recordingId = this.getNodeParameter('recordingId', i);
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `/api/recording/${recordingId}`,
                            json: true,
                        });
                        returnData.push(response);
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ error: error.message });
                    continue;
                }
                throw error;
            }
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.AillomVox = AillomVox;
