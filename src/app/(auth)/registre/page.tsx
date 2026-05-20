import React from "react";
import { getCentres } from "@/lib/airtable";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const centres = await getCentres();
  
  // Sort centers by name alphabetically
  const sortedCentres = [...centres].sort((a, b) => 
    a.nom.localeCompare(b.nom)
  );

  return <RegisterForm centres={sortedCentres} />;
}
