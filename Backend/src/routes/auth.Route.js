import { Router } from "express";
import { registerUserController, loginUserController, logoutUserController, getMeController } from "../controller/auth.Controller.js";
import authUser from "../middleware/auth.middleware.js"


const authRouter = Router()

/** 
    @route POST /api/auth/register
    @description register user 
    @access public
*/
authRouter.post("/register",registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */
authRouter.post("/login", loginUserController)


/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
authRouter.get("/logout",logoutUserController)


/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */
authRouter.get("/get-me",authUser, getMeController)


export default authRouter