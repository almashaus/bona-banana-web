import { z } from "zod";

export const campaignFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .trim(),

  sessionsCount: z
    .number()
    .int()
    .min(3, { message: "Minimum 3 sessions" })
    .max(7, { message: "Maximum 7 sessions" }),

  playersCount: z
    .number()
    .int()
    .min(3, { message: "Minimum 3 players" })
    .max(7, { message: "Maximum 7 players" }),

  playerNames: z
    .array(
      z
        .string()
        .min(2, { message: "Player name must be at least 2 characters" })
        .trim(),
    )
    .min(3, { message: "At least 3 player names required" })
    .max(7, { message: "Maximum 7 player names" }),

  price: z
    .number()
    .positive({ message: "Price must be greater than 0" }),

  startDate: z.string().min(1, { message: "Start date is required" }),

  sessionDates: z
    .array(z.string().min(1, { message: "Session date is required" }))
    .min(3, { message: "At least 3 session dates required" })
    .max(7, { message: "Maximum 7 session dates" }),

  city: z.object({
    ar: z.string().min(1, { message: "City (Arabic) is required" }),
    en: z.string().min(1, { message: "City (English) is required" }),
  }),
}).refine(
  (data) => data.playerNames.length === data.playersCount,
  {
    message: "Number of player names must match the players count",
    path: ["playerNames"],
  },
).refine(
  (data) => data.sessionDates.length === data.sessionsCount,
  {
    message: "Number of session dates must match the sessions count",
    path: ["sessionDates"],
  },
);

export type CampaignFormData = z.infer<typeof campaignFormSchema>;

export const campaignBookingSchema = z.object({
  campaignId: z.string().min(1, { message: "Campaign ID is required" }),
  sessionIds: z
    .array(z.string().min(1))
    .min(1, { message: "At least one session must be selected" }),
  playerId: z.string().min(1, { message: "Player selection is required" }),
});

export type CampaignBookingData = z.infer<typeof campaignBookingSchema>;
