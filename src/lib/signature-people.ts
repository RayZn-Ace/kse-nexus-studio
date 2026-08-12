import male1 from "@/assets/signatures/male-1.jpg.asset.json";
import male2 from "@/assets/signatures/male-2.jpg.asset.json";
import female1 from "@/assets/signatures/female-1.jpg.asset.json";
import female2 from "@/assets/signatures/female-2.jpg.asset.json";
import maleYoung from "@/assets/signatures/male-young.jpg.asset.json";
import femaleYoung from "@/assets/signatures/female-young.jpg.asset.json";

/** Absolute origin so signature photos load inside e-mail clients. */
export const PUBLIC_ORIGIN = "https://ksegroup.eu";

export const abs = (url: string) => (url.startsWith("http") ? url : `${PUBLIC_ORIGIN}${url}`);

export type SignaturePerson = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  photo_url?: string;
};

/** Auswählbare Absender inkl. Signaturfoto. */
export const SIGNATURE_PEOPLE: SignaturePerson[] = [
  {
    id: "kay",
    name: "Kay Engelmann",
    role: "Geschäftsführer · KSE GROUP",
    email: "kay@ksegroup.eu",
    phone: "+49 511 000000",
  },
  {
    id: "jonas",
    name: "Jonas Brandt",
    role: "Projektleiter · KSE GROUP",
    email: "jonas@ksegroup.eu",
    phone: "+49 511 000001",
    photo_url: abs(male1.url),
  },
  {
    id: "michael",
    name: "Michael Ostermann",
    role: "Senior Consultant · KSE GROUP",
    email: "michael@ksegroup.eu",
    phone: "+49 511 000002",
    photo_url: abs(male2.url),
  },
  {
    id: "alicia",
    name: "Alicia Tuchinsky",
    role: "Kundenbetreuerin · KSE GROUP",
    email: "marketing@ksegroup.eu",
    phone: "+49 511 000003",
    photo_url: abs(female1.url),
  },
  {
    id: "sandra",
    name: "Sandra Weiler",
    role: "Head of Operations · KSE GROUP",
    email: "sandra@ksegroup.eu",
    phone: "+49 511 000004",
    photo_url: abs(female2.url),
  },
  {
    id: "luca",
    name: "Luca Hartmann",
    role: "Junior Consultant · KSE GROUP",
    email: "luca@ksegroup.eu",
    phone: "+49 511 000005",
    photo_url: abs(maleYoung.url),
  },
  {
    id: "lena",
    name: "Lena Voigt",
    role: "Junior Kundenbetreuung · KSE GROUP",
    email: "lena@ksegroup.eu",
    phone: "+49 511 000006",
    photo_url: abs(femaleYoung.url),
  },
];
