import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());
app.get("/products",(req,res)=>{
    const data = fs.readFileSync("product.json","utf-8");
    const products = JSON.parse(data);
    res.json(products);
});

app.post("/products", (req, res) => {
    const newProduct = req.body;
    const data = fs.readFileSync("product.json", "utf-8");
    const products = JSON.parse(data);
    products.push(newProduct);
    fs.writeFileSync("product.json", JSON.stringify(products));
    res.status(201).json(newProduct);
});

app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});