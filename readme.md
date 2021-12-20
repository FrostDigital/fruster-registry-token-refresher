# Fruster Registry Token Refresher

Periodically updates docker login auth for ecr registries and updates kubernetes secret.

This is needed as ecr (and also other registries) only provide short lived tokens, so even if set while
creating a pod, it will eventually expire and not be present when kubernetes needs to reschedule the container.

## Usage

Configure by stringifying a JSON array and set in env var `REGISTRIES`

```javascript
[
  {
    name: "my-secret",
    type: "ecr",
    namespace: "my-namespace",
    awsRegistryId: "688714458383",
    awsAccessKeyId: "AXXXXXXXXXXXXXXX",
    awsSecretAccessKey: "GVXXXXXXXXXXXXXXXXX",
    region: "eu-west-1",
  },
];
```

```
REGISTRIES="[{\"name\":\"my-secret\",\"type\":\"ecr\",\"namespace\":\"my-namespace\",\"awsRegistryId\":\"688714458383\",\"awsAccessKeyId\":\"AXXXXXXXXXXXXXXX\",\"awsSecretAccessKey\":\"GVXXXXXXXXXXXXXXXXX\",\"region\":\"eu-west-1\"}]"
```

## Development

This was hacked in a short period of time. Feel free to improve and i.e. add support for other registries more than ecr!
