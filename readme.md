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
    namespace: "my-namespace",
    type: "ecr",
    awsRegistryId: "688714458383",
    awsAccessKeyId: "AXXXXXXXXXXXXXXX",
    awsSecretAccessKey: "GVXXXXXXXXXXXXXXXXX",
    region: "eu-west-1",
  },
];
```

---

| Key                  | Description                                                                                           | Example               |
| -------------------- | ----------------------------------------------------------------------------------------------------- | --------------------- |
| `name`               |  Name of k8s secret of type `kubernetes.io/dockerconfigjson` that will be generated                   | `registry-token`      |
| `namespace`          |  Namespace where secret will be created, should be same namespace as pods that needs to use the token | `my-namespace`        |
| `type`               |  Type of registry, only `ecr` is supported currently                                                  | `ecr`                 |
| `awsRegistryId`      |  Id of ecr registry                                                                                   | `688714458383`        |
| `awsAccessKeyId`     | Access key id for AWS user that has permissions to generate auth token                                | `AXXXXXXXXXXXXXXX`    |
| `awsSecretAccessKey` | Secret access key for AWS user that has permissions to generate auth token                            | `GVXXXXXXXXXXXXXXXXX` |
| `region`             | AWS region where ecr registry is located                                                              | `eu-west-1`           |

## Deployment

There are k8s specs for deployment, service account, cluster role and cluster role binding in the `k8s/` folder.
Note that you should replace values for `REGISTRIES` (and base64 encode it) to fit your needs.

Once done, apply it with:

```
kubectl apply -f k8s/deployment.yaml
```

## Development

This was hacked in a short period of time. Feel free to improve and i.e. add support for other registries more than ecr!
