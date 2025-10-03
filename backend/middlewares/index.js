import cors from "cors";
import bodyParser from "body-parser";
import express from "express";

export default function registerMiddlewares(app) {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.json()); 

}