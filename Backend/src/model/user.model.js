import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
},{
    timestamps:true
})


userSchema.pre("save",async function() {
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password,10)
    
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("user", userSchema)


export default userModel