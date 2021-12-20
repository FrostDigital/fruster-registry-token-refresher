const {
  ECRClient,
  GetAuthorizationTokenCommand,
} = require("@aws-sdk/client-ecr");
const { KubeConfig, CoreV1Api, AppsV1Api } = require("@kubernetes/client-node");
const ms = require("ms");

// Assume that app runs deployed in k8s cluster if these env vars are set
const isInCluster =
  process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_PORT;

const kc = new KubeConfig();

if (isInCluster) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}
console.log("Connected to cluster", kc.getCurrentCluster()?.name);

const k8sApi = kc.makeApiClient(CoreV1Api);

/**
 * Config should be on format:
 *
 * [
 *      {
 *        name: "wb-ecr",
 *        type: "ecr",
 *        namespace: "wb",
 *        awsRegistryId: "XXXXX",
 *        awsAccessKeyId: "AXXXXXXXXXXXXX",
 *        awsSecretAccessKey: "GVXXXXXXXXXXXXX",
 *        region: "eu-west-1"
 *      }
 * ];
 */
const config = JSON.parse(process.env.REGISTRIES || "[]");

const interval = "15m";

// run every 20 min
setInterval(refreshTokens, ms(interval));

console.log(
  "Starting refresh, will refresh",
  config.length,
  "registries every",
  interval
);

// run directly at start
refreshTokens();

async function refreshTokens() {
  for (const reg of config) {
    const {
      name,
      namespace,
      type,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegistryId,
      region,
    } = reg;

    if (type === "ecr") {
      const client = new ECRClient({
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
        region,
      });
      const command = new GetAuthorizationTokenCommand({
        registryIds: [awsRegistryId],
      });
      const response = await client.send(command);

      const [{ authorizationToken, proxyEndpoint }] =
        response.authorizationData || [];

      const auth = {
        auths: {
          [proxyEndpoint + ""]: { auth: authorizationToken },
          email: "none@none.com",
        },
      };

      const data = {
        ".dockerconfigjson": Buffer.from(JSON.stringify(auth)).toString(
          "base64"
        ),
      };

      let exists = false;

      try {
        await k8sApi.readNamespacedSecret(name, namespace);
        exists = true;
      } catch (err) {
        if (err.statusCode === 404) {
          exists = false;
        } else {
          console.error("Failed reading secret", err.statusCode, err.message);
          return;
        }
      }

      if (!exists) {
        console.log(
          new Date(),
          "Secret does not exist, creating new one",
          name
        );
        try {
          await k8sApi.createNamespacedSecret(namespace, {
            type: "kubernetes.io/dockerconfigjson",
            metadata: {
              name,
              annotations: {
                "fruster.io/lastRefreshed": new Date().toISOString(),
              },
            },
            data,
          });
        } catch (err) {
          console.error("Failed creating secret", JSON.stringify(err));
        }
      } else {
        console.log(new Date(), "Refreshing token for", name);

        try {
          await k8sApi.patchNamespacedSecret(
            name,
            namespace,
            {
              metadata: {
                annotations: {
                  "fruster.io/lastRefreshed": new Date().toISOString(),
                },
              },
              data,
            },
            undefined,
            undefined,
            undefined,
            undefined,
            {
              headers: {
                "Content-Type": "application/strategic-merge-patch+json",
              },
            }
          );
        } catch (err) {
          console.error("Failed patching secret", JSON.stringify(err));
        }
      }
    }
  }
}
