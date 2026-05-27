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
                displayName: 'Provider',
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
                default: 'inworld',
                description: 'Provider or AillomVox TTS engine to list voices from',
            },
            {
                displayName: 'Search',
                name: 'q',
                type: 'string',
                default: '',
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
                description: 'Optional voice search query',
            },
            {
                displayName: 'Voice Scope',
                name: 'scope',
                type: 'options',
                options: [
                    {
                        name: 'All',
                        value: '',
                    },
                    {
                        name: 'Workspace Clones',
                        value: 'clone',
                    },
                ],
                default: '',
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
                description: 'Limit results to all voices or workspace-owned cloned voices',
            },
            {
                displayName: 'Include Voices',
                name: 'includeVoices',
                type: 'boolean',
                default: false,
                displayOptions: {
                    show: {
                        resource: [
                            'info',
                        ],
                        operation: [
                            'getProviders',
                        ],
                    },
                },
                description: 'Whether to include nested voice catalogs in the providers response. Can be large.',
            },
            {
                displayName: 'Workspace ID',
                name: 'workspaceId',
                type: 'string',
                default: '',
                displayOptions: {
                    show: {
                        resource: [
                            'info',
                        ],
                    },
                },
                description: 'Optional workspace scope. The API key must belong to this workspace.',
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
        const credentials = await this.getCredentials('aillomVoxApi');
        const baseUrl = String(credentials.baseUrl || 'https://vox.aillom.com').replace(/\/+$/, '');

        for (let i = 0; i < items.length; i++) {
            try {
                if (resource === 'info') {
                    if (operation === 'getVoices') {
                        const provider = this.getNodeParameter('provider', i) as string;
                        const workspaceId = this.getNodeParameter('workspaceId', i, '') as string;
                        const q = this.getNodeParameter('q', i, '') as string;
                        const scope = this.getNodeParameter('scope', i, '') as string;
                        const qs: IDataObject = {};
                        if (provider) {
                            qs.provider = provider;
                        }
                        if (workspaceId) {
                            qs.workspace_id = workspaceId;
                        }
                        if (q) {
                            qs.q = q;
                        }
                        if (scope) {
                            qs.scope = scope;
                        }

                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `${baseUrl}/api/voices`,
                            qs,
                            json: true,
                        });

                        returnData.push(response as IDataObject);
                    } else if (operation === 'getProviders') {
                        const includeVoices = this.getNodeParameter('includeVoices', i, false) as boolean;
                        const workspaceId = this.getNodeParameter('workspaceId', i, '') as string;
                        const qs: IDataObject = {
                            include_voices: includeVoices,
                        };
                        if (workspaceId) {
                            qs.workspace_id = workspaceId;
                        }
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `${baseUrl}/api/providers`,
                            qs,
                            json: true,
                        });
                        returnData.push(response as IDataObject);
                    } else if (operation === 'getPricing') {
                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `${baseUrl}/api/pricing`,
                            json: true,
                        });
                        returnData.push(response as IDataObject);
                    }
                } else if (resource === 'recording') {
                    if (operation === 'getDownloadUrl') {
                        const recordingId = this.getNodeParameter('recordingId', i) as string;

                        const response = await this.helpers.requestWithAuthentication.call(this, 'aillomVoxApi', {
                            method: 'GET',
                            uri: `${baseUrl}/api/recording/${recordingId}`,
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
