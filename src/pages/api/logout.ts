import { deleteCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  deleteCookie("member", { req, res });
  res.status(200).json({ message: "Logged out" });
}
