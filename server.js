
import express from "express";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./database.sqlite");
const app = express();
app.use(express.json());

// ---- Barrier Master ----
app.post("/barrier/create", (req,res)=>{
    const {name} = req.body;
    db.run("INSERT INTO barrier (name) VALUES (?)",[name],function(err){
        if(err) return res.status(500).json({error:err.message});
        res.json({id:this.lastID, name});
    });
});

app.delete("/barrier/:id", (req,res)=>{
    db.run("DELETE FROM barrier WHERE id = ?",[req.params.id], function(err){
        if(err) return res.status(500).json({error:err.message});
        res.json({deleted: this.changes});
    });
});

// ---- Barrier Membership ----
app.get("/barrier/member/:member", (req,res)=>{
    db.all(
        `SELECT bm.id, b.name AS barrier, bm.member, bm.deal_id
         FROM barrier_members bm
         JOIN barrier b ON b.id = bm.barrier_id
         WHERE bm.member = ?`,
         [req.params.member],
         (err,rows)=>{
            if(err) return res.status(500).json({error:err.message});
            res.json(rows);
         }
    );
});

app.get("/barrier/member", (req,res)=>{
    db.all(
        `SELECT bm.id, b.name AS barrier, bm.member, bm.deal_id
         FROM barrier_members bm
         JOIN barrier b ON b.id = bm.barrier_id`,
         [],
         (err,rows)=>{
            if(err) return res.status(500).json({error:err.message});
            res.json(rows);
         }
    );
});

app.post("/barrier/member/add",(req,res)=>{
    const {barrier_id, member, deal_id} = req.body;
    db.run(
        "INSERT INTO barrier_members (barrier_id, member, deal_id) VALUES (?,?,?)",
        [barrier_id, member, deal_id],
        function(err){
            if(err) return res.status(500).json({error:err.message});
            res.json({id:this.lastID});
        }
    );
});

// ---- Deal Master ----
app.post("/deal/create",(req,res)=>{
    const {name} = req.body;
    db.run("INSERT INTO deal (name) VALUES (?)",[name], function(err){
        if(err) return res.status(500).json({error:err.message});
        res.json({id:this.lastID, name});
    });
});

app.delete("/deal/:id",(req,res)=>{
    db.run("DELETE FROM deal WHERE id = ?",[req.params.id], function(err){
        if(err) return res.status(500).json({error:err.message});
        res.json({deleted: this.changes});
    });
});

// ---- Deal Membership ----
app.post("/deal/check",(req,res)=>{
    const {deal_id, member} = req.body;
    db.get(
        "SELECT role FROM deal_members WHERE deal_id=? AND member=?",
        [deal_id, member],
        (err,row)=>{
            if(err) return res.status(500).json({error:err.message});
            if(!row) return res.status(404).json({error:"Not found"});
            res.json({member, role: row.role});
        }
    );
});

app.post("/deal/member/add",(req,res)=>{
    const {deal_id, member, role} = req.body;
    db.get("SELECT id FROM deal WHERE id=?",[deal_id], (err,deal)=>{
        if(err) return res.status(500).json({error:err.message});
        if(!deal) return res.status(404).json({error:"Deal not found"});
        db.run(
            "INSERT INTO deal_members (deal_id, member, role) VALUES (?,?,?)",
            [deal_id, member, role],
            function(err){
                if(err) return res.status(500).json({error:err.message});
                res.json({id:this.lastID});
            }
        );
    });
});

app.listen(3000, ()=> console.log("Server running on port 3000"));
