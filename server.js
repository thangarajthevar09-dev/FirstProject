const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// MULTER SETUP 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

//  UTIL FUNCTIONS 
const loadData = (file) => {
    try {
        if (!fs.existsSync(file)) return [];
        return JSON.parse(fs.readFileSync(file));
    } catch (err) {
        console.error("Error reading", file, err);
        return [];
    }
};

const saveData = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing", file, err);
    }
};

//  FEEDBACK 
app.post("/submit-feedback", (req, res) => {
    try {
        const data = loadData("feedback.json");

        const newFeedback = {
            id: Date.now(),
            ...req.body,
            time: new Date().toLocaleString()
        };

        data.push(newFeedback);
        saveData("feedback.json", data);

        res.json({ message: "Feedback Saved" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save feedback" });
    }
});

app.get("/feedbacks", (req, res) => {
    res.json(loadData("feedback.json"));
});

//  TASKS 
app.post("/assign-task", (req, res) => {
    try {
        const tasks = loadData("tasks.json");

        const existing = tasks.find(t => t.feedbackId === req.body.feedbackId);

        if (existing) {
            return res.json({ message: "Already assigned" });
        }

        const newTask = {
            id: Date.now(),
            feedbackId: req.body.feedbackId,
            worker: req.body.worker,
            status: "Pending",
            image: null,
            time: new Date().toLocaleString()
        };

        tasks.push(newTask);
        saveData("tasks.json", tasks);

        res.json({ message: "Task Assigned" });
    } catch (err) {
        res.status(500).json({ error: "Assign failed" });
    }
});

app.get("/tasks", (req, res) => {
    res.json(loadData("tasks.json"));
});

//  COMPLETE TASK 
app.post("/complete-task", upload.single("image"), (req, res) => {
    try {
        const tasks = loadData("tasks.json");

        const task = tasks.find(t => t.id == req.body.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        task.status = "Completed";
        task.image = "/uploads/" + req.file.filename;
        task.completedTime = new Date().toLocaleString();

        saveData("tasks.json", tasks);

        res.json({ message: "Task Completed" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Completion failed" });
    }
});

//  REJECT 
app.post("/reject-task", (req, res) => {
    try {
        const tasks = loadData("tasks.json");

        const task = tasks.find(t => t.id == req.body.id);

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        task.status = "Rejected";

        saveData("tasks.json", tasks);

        res.json({ message: "Task Rejected" });
    } catch (err) {
        res.status(500).json({ error: "Reject failed" });
    }
});

//  START 
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});