import userModel from "../model/user.model.js"
import jwt from "jsonwebtoken"
import tokenBlacklistModel from "../model/blacklist.model.js"


async function registerUserController(req,res) {
    const {username, email, password} = req.body

    if(!username || !email || !password){
        return res.status(400).json({message:"Please provide all the required fields"})
    }

    const isExistingUser = await userModel.findOne({
        $or: [{username},{email}]
    })

    if(isExistingUser){
        return res.status(400).json({message:"User already exists"})
    }

    
    const user = await userModel.create({
        username,
        email,
        password
    })
    const token = jwt.sign({
            id:user._id,
            username:user.username
        },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token",token);
    
    res.status(201).json(
        {message:"User registered successfully",
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                
            }
        })
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

export{
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}