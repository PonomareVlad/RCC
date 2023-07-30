import {MongoFetchClient} from "mongo-fetch";

export const {name, url, apiKey, source} = process.env;

export const db = new MongoFetchClient(source, {url, apiKey}).db(name);

export const accounts = db.collection("accounts");
export const rounds = db.collection("rounds");
export const votes = db.collection("votes");
