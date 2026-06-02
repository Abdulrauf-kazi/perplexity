import type { NextFunction, Request, Response } from "express";
import { supabase } from "./client";
import { prisma } from "./prisma/db";
import { embeddingsListModels } from "@openrouter/sdk/funcs/embeddingsListModels.js";

export async function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    const data = await supabase.auth.getUser(token);
    const userId = data.data.user?.id

    if (userId) {
        try {
            await prisma.user.create({
                data: {
                    id: data.data.user?.id,
                    email: data.data.user?.email!,
                    name: data.data.user?.user_metadata.full_name,
                    provider: data.data.user?.app_metadata.provider === "google" ? "Google" : "Github",
                }
            })
        } catch (e) {
            console.log(e);
        }

        req.userId = userId
        next()
    } else {
        res.status(403).json({
            Message: "Incorrect Inputs"
        })
    }
}