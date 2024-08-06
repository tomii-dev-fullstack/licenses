import { Router } from "express";
const router = Router()




router.get("/", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    res.send("Hello World!");
})

export default router