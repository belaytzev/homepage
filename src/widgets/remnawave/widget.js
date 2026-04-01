import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget = {
  api: "{url}/api/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings: {
    stats: {
      endpoint: "system/stats",
    },
    "stats/bandwidth": {
      endpoint: "system/stats/bandwidth",
    },
    nodes: {
      endpoint: "nodes",
    },
  },
};

export default widget;
