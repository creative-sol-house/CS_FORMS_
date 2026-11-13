import mongoose from "mongoose";
import dns from "node:dns";

// Force Node.js to use Google DNS globally
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

const uri: string = MONGODB_URI; 

let cached = (global as any).mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4
      // This is the key part that forces the DNS lookup
      lookup: (hostname: string, options: any, callback: any) => {
        const resolver = new dns.Resolver();
        resolver.setServers(["8.8.8.8", "1.1.1.1"]);
        resolver.resolve4(hostname, (err, addresses) => {
          if (err) return callback(err);
          callback(null, addresses[0], 4);
        });
      }
    } as any);
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
}