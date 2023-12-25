# Kal

![Kal CLI Demo Animation](./kal-demo.gif)

Kal is a self-hosted, open-source, serverless CLI-based email newsletter app.

Kal exposes a public REST API to manage subscribers, enabling you to set up custom frontends (e.g., subscribe forms) or other automation.

You can write and send emails using the CLI from any machine (Windows / Linux / Mac OS).

## Quick Start

To begin using Kal, ensure you have the following:

- AWS account (free-tier works just fine)
- SMTP server (Outlook or Gmail can be used initially)
- NodeJS (preferably the latest LTS, currently 20.10.0)
- Go (for compiling the CLI, prebuilt binary releases are not available yet)

### Step 1: Configure AWS CLI

Follow [the official docs](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) to install the AWS CLI. After installation, run `aws configure` to set up your access key and region locally. It's recommended to use an IAM user's access key (with sufficient access) rather than the root account.

For more information on access keys and how to generate them, consult the [AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html).

### Step 2: Deploy the Backend

Clone this repository, switch to the `backend` folder, and install dependencies by running `npm i`.

We use [SST](https://sst.dev) to deploy the Serverless backend on AWS. To deploy, run: `npx sst deploy --region us-west-1 --stage test`. You can use any `AWS_REGION` and stage name. You can also deploy multiple instances of Kal on different stages using different names.

SST will deploy a CloudFormation stack to create and manage all necessary resources. To update, pull the latest code, and run the same `npx sst deploy` command again.

### Step 3: Install Kal CLI

The Kal CLI can be installed on any machine, not necessarily the same machine where you deployed the backend.

Clone the repository, switch to the `cli` folder, and run `go install` to compile and install Kal CLI on your machine.

For more information and to ensure Kal is available in your `$PATH`, refer to [the official Go docs on compiling and installing](https://go.dev/doc/tutorial/compile-install).

### Step 4: Setting up Kal CLI

*coming soon*

### Using Kal

#### Creating a New Email

To write a new email, run: `kal new my-first-email`. This will create the markdown email at `emails/my-first-email.md` and open it for editing. Write the email and then save!

You can use [Liquid templating](https://shopify.github.io/liquid/) to use variables and filters. *More docs on this soon*

#### Sending an Email as a Broadcast

Broadcast an email to all subscribers using: `kal send my-first-email`

#### Managing Subscribers

To add a subscriber: `POST /sub` with the name and email as `application/json` payload.

Example:
```json
{
  "name": "Tanay",
  "email": "hi@tanay.xyz"
}
```

To unsubscribe, `GET /unsub` with the `id` as a query parameter.

## Tasks and planned features

- [x] Confirmation email
- [x] Unsubscribing
- [ ] Authentication
- [ ] Config command
- [ ] Templates
- [ ] Scheduling emails
- [ ] Filters while sending
- [ ] Support for multiple lists
- [ ] Support for multiple users
- [ ] Email deliverability
- [ ] Support for multiple SMTP servers
- [ ] Sequences and automations
- [ ] Tracking: open rates and link clicks
- [ ] Styling

## FAQs

### Why do you call it Kal?
It's named after Kaladin from [the Stormlight Archive](https://www.goodreads.com/series/49075-the-stormlight-archive), who is one of my favorite fictional characters of all time. I think it goes well as a name for a CLI too.
