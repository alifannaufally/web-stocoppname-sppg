import { requireOperational } from "@/lib/auth";
import { InputHarianClient } from "./client";

export default async function InputPage() {
  await requireOperational();

  return <InputHarianClient />;
}
