import React from "react";
import { roundMoney } from "./utils";

export const price = (amount: number, language: string = "en") => {
  const formatted = roundMoney(amount).toFixed(2);
  switch (language) {
    case "en":
      return (
        <>
          <span className="icon-saudi_riyal" />
          {formatted}
        </>
      );
    case "ar":
      return (
        <>
          {formatted}
          <span className="icon-saudi_riyal" />
        </>
      );
    default:
      return (
        <>
          <span className="icon-saudi_riyal" />
          {formatted}
        </>
      );
  }
};
