# n8n-nodes-mattermost-file-upload

This is an n8n community node. It lets you upload files to [Mattermost](https://mattermost.com/) channels in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- **Upload File**: Upload a binary file to a Mattermost channel and create a post with the file attached. Supports an optional message caption.

## Credentials

This node uses Mattermost API credentials.
You need to follow the n8n's own Mattermost credential creation path.

## Compatibility

- Minimum n8n version: 1.0.0

## Usage

This node uploads a binary file (from a previous node's output) to a specified Mattermost channel and creates a post containing that file.

Parameters:

- **Channel ID**: The ID of the Mattermost channel to upload to
- **Binary Property**: The name of the binary property containing the file (defaults to `data`)
- **Caption**: An optional message to include with the file

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Mattermost API documentation](https://developers.mattermost.com/integrate/api/)

## Version history

- 0.1.0 - Initial release with file upload operation
