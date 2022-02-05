# Fruster Registry Token Refresher

Periodically updates docker login auth for ecr registries and updates kubernetes secret.

This is needed as ecr (and also other registries) only provide short lived tokens, so even if set while
creating a pod, it will eventually expire and not be present when kubernetes needs to reschedule the container.

## Usage

Configure by stringifying and base64 encode a JSON array and set in secret `registry-token-refresher` with key `REGISTRIES`.

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

## Deployment

There are k8s specs for deployment, service account, cluster role and cluster role binding in the `k8s/` folder.
Note that you should replace values for `REGISTRIES` (and base64 encode it) to fit your needs.

Once done, apply it with:

```
kubectl apply -f k8s/deployment.yaml
```

## Development

This was hacked in a short period of time. Feel free to improve and i.e. add support for other registries more than ecr!
