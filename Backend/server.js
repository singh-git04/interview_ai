import "dotenv/config"
import app from "./src/app.js";
import connectDB from "./src/config/database.js";

const PORT = process.env.PORT || 3000;

connectDB()

app.listen(process.env.PORT ,() => {
    console.log(`Server is running on port ${PORT}`);
});
