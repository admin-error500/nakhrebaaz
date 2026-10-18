import { z } from "zod";
export const addressInputSchema=z.object({
 tag:z.enum(["HOME","OFFICE"]),
 recipientName:z.string().trim().min(2).max(80),
 phone:z.string().regex(/^[6-9][0-9]{9}$/,"Enter a valid 10-digit Indian phone number"),
 line1:z.string().trim().min(5).max(200),
 line2:z.string().trim().max(160).nullable().optional(),
 landmark:z.string().trim().max(120).nullable().optional(),
 city:z.string().trim().min(2).max(80),
 state:z.string().trim().min(2).max(80),
 pincode:z.string().regex(/^[0-9]{6}$/,"Enter a valid 6-digit PIN code"),
 isDefault:z.boolean(),
});
export type AddressInput=z.infer<typeof addressInputSchema>;
