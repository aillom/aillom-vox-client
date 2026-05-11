import {
    IExecuteFunctions,
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

export class AillomVox implements INodeType {
    description: INodeTypeDescription = {
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
                        description: 'Returns providers, models, and nested voice catalogs',
                        action: 'Get providers',
                    },
                    {
                        name: 'Get Pricing',
                        value: 'getPricing',
                        description: 'Returns the public USD/min rate card',
                        action: 'Get pricing',
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
                        name: 'AWS Nova',
                        value: 'aws',
                    },
                    {
                        name: 'Fish Audio',
                        value: 'fish',
                    },
                    {
                        name: 'Gemini',
                        value: 'gemini',
                    },
                    {
                        name: 'Grok',
                        value: 'grok',
                    },
                    {
                        name: 'Inworld',
                        value: 'inworld',
                    },
                    {
                        name: 'LMNT',
                        value: 'lmnt',
                    },
                    {
                        name: 'OpenAI',
                        value: 'openai',
                    },
                    {
                        name: 'Qwen',
                        value: 'qwen',
                    },
                    {
                        name: 'Rime',
                        value: 'rime',
                    },
                    {
                        name: 'Soniox',
                        value: 'soniox',
                    },
                    {
                        name: 'Ultravox',
                        value: 'ultravox',
                    },
                    {
                        name: 'xAI',
                        value: 'xai',
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

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: IDataObject[] = [];
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;

        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'info') {
                    if (operation === 'getVoices') {
                        const provider = this.getNodeParameter('provider', i) as string;
                        const qs: IDataObject = {};
                        if (provider) {
                            qs.provider = provider;
                        }

                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: '/api/voices',
                            qs,
                            json: true,
                        });

                        returnData.push(response as IDataObject);
                    } else if (operation === 'getProviders') {
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: '/api/providers',
                            json: true,
                        });
                        returnData.push(response as IDataObject);
                    } else if (operation === 'getPricing') {
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: '/api/pricing',
                            json: true,
                        });
                        returnData.push(response as IDataObject);
                    }
                } else if (resource === 'recording') {
                    if (operation === 'getDownloadUrl') {
                        const recordingId = this.getNodeParameter('recordingId', i) as string;

                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `/api/recording/${recordingId}`,
                            json: true,
                        });

                        returnData.push(response as IDataObject);
                    }
                }
            } catch (error) {
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
