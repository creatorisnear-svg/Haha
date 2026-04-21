import { MongoClient, Db } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://creatorisnear_db_user:YHLbFYwcD6Efz0Dt@cluster0.zfris1s.mongodb.net/?appName=Cluster0";

const client = new MongoClient(MONGODB_URI);

let db: Db;

export async function getDb(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db("vigr_apparel");
  }
  return db;
}
