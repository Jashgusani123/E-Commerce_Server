import express from "express";
import { newUser ,getAllUser ,getUserById ,deleteUser } from "../Controllers/UserControll.js";
import { adminOnly } from "../Middlewares/Auth.js";
const app = express.Router();

app.post("/new",newUser);
app.get("/all", adminOnly, getAllUser);
app.route("/:id").get(getUserById).delete(adminOnly,deleteUser);

export default app; 