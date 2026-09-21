import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MattermostApi implements ICredentialType {
	name = 'mattermostFilesApi';

	displayName = 'Mattermost Files API';

	documentationUrl = 'https://developers.mattermost.com/integrate/reference/rest-api/';

	properties: INodeProperties[] = [
		{
			displayName: 'Mattermost URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://mattermost.example.com',
			placeholder: 'https://mattermost.example.com',
			required: true,
		},
		{
			displayName: 'Bot Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};
}
