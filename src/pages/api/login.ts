import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { member } = req.body;

  if (!member) {
    return res.status(400).json({ error: "Missing token" });
  }

  setCookie("member", member, {
    req,
    res,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // يوم
  });

  res.status(200).json({ message: "Token saved" });
}
