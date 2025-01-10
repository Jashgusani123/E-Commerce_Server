import express from "express";
import { adminOnly } from "../Middlewares/Auth.js";
import { getDashboardStats , getPieChart , getLineChart , getBarChart} from "../Controllers/AdminControll.js";

const app = express.Router();

app.use(adminOnly)

app.get("/stats" , getDashboardStats)

app.get("/pie" , getPieChart)

app.get("/bar" , getBarChart)

app.get("/line" , getLineChart)


export default app;