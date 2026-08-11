import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;

if (!URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable so the client is not
  // re-created on every hot-reload.
  if (!global._mongoClientPromise) {
    client = new MongoClient(URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(URI, options);
  clientPromise = client.connect();
}

export default clientPromise;
