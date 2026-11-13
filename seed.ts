const dns = require("node:dns").promises;
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Force Google DNS

const srvHost = "_mongodb._tcp.cluster0.4uxviym.mongodb.net";

async function getConnectionString() {
  try {
    console.log("Fetching SRV record from Google DNS...");
    // Resolve the actual shard hostnames
    const records = await dns.resolveSrv(srvHost);
    
    // Build the host portion of the string
    const hosts = records.map((r: { name: any; port: any; }) => `${r.name}:${r.port}`).join(",");
    
    console.log("\n=======================================================");
    console.log("SUCCESS! Here are your actual shard hosts:");
    console.log("=======================================================\n");
    console.log(hosts);
    console.log("\n=======================================================\n");
    
  } catch (err) {
console.error("\nFailed to resolve SRV record:", (err as Error).message);    console.log("Your network is blocking outbound DNS. You must use a Mobile Hotspot.");
  }
}

getConnectionString();