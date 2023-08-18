import {
    MongoFetchClient
} from "mongo-fetch";

export const {
    DATA_API_DB: name,
    DATA_API_URL: url,
    DATA_API_KEY: apiKey,
    DATA_API_SOURCE: source,
} = process.env;

export const db = new MongoFetchClient(source, {url, apiKey}).db(name);

export const accounts = db.collection("accounts");
export const stages = db.collection("stages");
export const rounds = db.collection("rounds");
export const votes = db.collection("votes");
