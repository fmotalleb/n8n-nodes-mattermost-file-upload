import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IDataObject,
	NodeOperationError,
	NodeConnectionTypes,
} from 'n8n-workflow';

interface MattermostUploadResponse {
	file_infos?: Array<{
		id: string;
		name?: string;
		size?: number;
		mime_type?: string;
		extension?: string;
		user_id?: string;
		post_id?: string;
	}>;
}

interface MattermostPostResponse {
	id?: string;
	channel_id?: string;
	user_id?: string;
	message?: string;
	file_ids?: string[];
	create_at?: number;
	update_at?: number;
}

export class Mattermost implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mattermost',
		name: 'mattermost',
		icon: 'file:mattermost.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Upload files and create Mattermost posts',
		defaults: {
			name: 'Mattermost',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],

		credentials: [
			{
				name: 'mattermostApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Upload File',
						value: 'uploadFile',
						description:
							'Upload a binary file and create a Mattermost post',
						action: 'Upload a file',
					},
				],
				default: 'uploadFile',
				noDataExpression: true,
			},

			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
				description: 'Mattermost channel ID',
			},

			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'data',
				description:
					'Name of the n8n binary property containing the file',
			},

			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Optional caption...',
				description: 'Message to post with the uploaded file',
			},
		],

		usableAsTool: true,
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials(
			'mattermostApi',
		);

		const baseUrl = String(credentials.baseUrl).replace(/\/+$/, '');
		const token = String(credentials.accessToken);
		const allowUnauthorizedCerts =
			credentials.allowUnauthorizedCerts === true;

		const operation = this.getNodeParameter('operation', 0);

		if (operation !== 'uploadFile') {
			throw new NodeOperationError(
				this.getNode(),
				`Unsupported operation: ${operation}`,
			);
		}

		for (
			let itemIndex = 0;
			itemIndex < items.length;
			itemIndex++
		) {
			try {
				const channelId = String(
					this.getNodeParameter('channelId', itemIndex),
				);

				const binaryProperty = String(
					this.getNodeParameter(
						'binaryProperty',
						itemIndex,
					),
				);

				const caption = String(
					this.getNodeParameter('caption', itemIndex),
				);

				const binaryData =
					items[itemIndex].binary?.[binaryProperty];

				if (!binaryData) {
					throw new NodeOperationError(
						this.getNode(),
						`Binary property "${binaryProperty}" does not exist`,
						{
							itemIndex,
						},
					);
				}

				const buffer =
					await this.helpers.getBinaryDataBuffer(
						itemIndex,
						binaryProperty,
					);

				const filename =
					binaryData.fileName ?? 'file';

				const mimeType =
					binaryData.mimeType ??
					'application/octet-stream';

				const uploadUrl =
					`${baseUrl}/api/v4/files` +
					`?channel_id=${encodeURIComponent(
						channelId,
					)}`;

				const form = new FormData();

				form.append(
					'files',
					new Blob([buffer], {
						type: mimeType,
					}),
					filename,
				);

				// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
				const uploadResponse =
					await this.helpers.httpRequest({
						method: 'POST',
						url: uploadUrl,
						headers: {
							Authorization: `Bearer ${token}`,
						},
						body: form,
						json: true,
						skipSslCertificateValidation:
							allowUnauthorizedCerts,
					});

				const upload =
					uploadResponse as MattermostUploadResponse;

				const fileId =
					upload.file_infos?.[0]?.id;

				if (!fileId) {
					throw new NodeOperationError(
						this.getNode(),
						'Mattermost uploaded the file but did not return a file ID',
						{
							itemIndex,
						},
					);
				}

				const postUrl =
					`${baseUrl}/api/v4/posts`;

				// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
				const postResponse =
					await this.helpers.httpRequest({
						method: 'POST',
						url: postUrl,
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
						body: {
							file_ids: [fileId],
							message: caption,
							channel_id: channelId,
						},
						json: true,
						skipSslCertificateValidation:
							allowUnauthorizedCerts,
					});

				const post =
					postResponse as MattermostPostResponse;

				if (!post.id) {
					throw new NodeOperationError(
						this.getNode(),
						'Mattermost uploaded the file but failed to create the post',
						{
							itemIndex,
						},
					);
				}

				returnData.push({
					json: {
						success: true,
						fileId,
						postId: post.id,
						channelId,
						caption,
						fileName: filename,
						fileSize: buffer.length,
						mimeType,
						file:
							upload.file_infos?.[0] ?? {},
						post,
					} as IDataObject,

					pairedItem: {
						item: itemIndex,
					},
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error:
								error instanceof Error
									? error.message
									: String(error),
						},
						pairedItem: {
							item: itemIndex,
						},
					});

					continue;
				}

				throw new NodeOperationError(
					this.getNode(),
					error,
				);
			}
		}

		return [returnData];
	}
}
