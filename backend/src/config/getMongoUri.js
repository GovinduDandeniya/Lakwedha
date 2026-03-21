const fetch = globalThis.fetch;

/**
 * Utility to completely bypass Node.js and OS-level DNS issues with mongodb+srv
 * by utilizing DNS over HTTPS (DoH) to resolve the cluster nodes.
 */
async function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is undefined");

  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  try {
    const withoutScheme = uri.split("mongodb+srv://")[1];
    const credentialsAndHost = withoutScheme.split("/")[0];
    
    let credentials = "";
    let srvHost = credentialsAndHost;
    
    if (credentialsAndHost.includes("@")) {
      const parts = credentialsAndHost.split("@");
      credentials = parts[0] + "@";
      srvHost = parts[1];
    }
    
    const dbNameParams = withoutScheme.split("/")[1] || "?retryWrites=true&w=majority";
    
    console.log(`[Mongo URI Resolver] Bypassing ISP DNS - Attempting DoH lookup for ${srvHost}...`);
    
    // Using Google DNS over HTTPS to avoid local ECONNREFUSED UDP errors
    const dnsUrl = `https://dns.google/resolve?name=_mongodb._tcp.${srvHost}&type=SRV`;
    const res = await fetch(dnsUrl);
    const data = await res.json();

    if (!data.Answer || data.Answer.length === 0) {
       throw new Error("No SRV coordinates found from Google DoH.");
    }

    // Format of data.data is generally: "priority weight port target"
    // e.g. "0 0 27017 ac-abcd-shard-00-00.xyz.mongodb.net."
    const hostString = data.Answer.map(ans => {
        const parts = ans.data.trim().split(/\s+/);
        const port = parts[2];
        let target = parts[3];
        if (target.endsWith('.')) target = target.slice(0, -1);
        return `${target}:${port}`;
    }).join(",");
    
    const finalUri = `mongodb://${credentials}${hostString}/${dbNameParams}&ssl=true&authSource=admin`;
    console.log(`[Mongo URI Resolver] Successfully resolved DoH DNS String! Launching Mongoose...`);
    return finalUri;

  } catch (err) {
    console.warn("[Mongo URI Resolver] DoH bypass failed, falling back to original scheme. Error:", err.message);
    return uri;
  }
}

module.exports = getMongoUri;
