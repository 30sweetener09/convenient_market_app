import cors from "cors";
import bodyParser from "body-parser";

export default function registerMiddlewares(app) {
  app.use(cors());
  app.use(bodyParser.json());
}