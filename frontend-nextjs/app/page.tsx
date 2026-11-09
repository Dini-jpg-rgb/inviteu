import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { TEMPLATES_REGISTRY } from "./(designer)/designer/templates/themes/registry";
import { LandingPage } from "./LandingPage";
import { landingFaq } from "./landing-faq";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Undangan Digital & Pernikahan Online Elegan | InviteU",
  description:
    "Buat undangan digital pernikahan yang elegan dan mudah dibagikan. Pilih desain, kelola informasi acara dan RSVP, lalu bagikan undangan online Anda bersama InviteU.",
  alternates: {
    canonical: "https://inviteu.id",
  },
  openGraph: {
    title: "Undangan Digital & Pernikahan Online Elegan | InviteU",
    description:
      "Rancang undangan digital pernikahan, kelola RSVP, dan bagikan momen spesial dengan mudah bersama InviteU.",
    url: "https://inviteu.id",
    siteName: "InviteU",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undangan Digital & Pernikahan Online Elegan | InviteU",
    description:
      "Rancang undangan digital pernikahan, kelola RSVP, dan bagikan momen spesial dengan mudah bersama InviteU.",
  },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: landingFaq.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className={`${playfairDisplay.variable} ${dmSans.variable}`}>
        <AntdRegistry>
          <LandingPage
            templates={TEMPLATES_REGISTRY.map((template) => ({
              slug: template.slug,
              name: template.name,
              themeCategory: template.themeCategory,
              thumbnail: template.thumbnail,
              heroImage: template.content.heroImage,
              coupleNames: `${template.content.couple.groom} & ${template.content.couple.bride}`,
              eventDate: `${template.content.saveTheDate.dateNumber} ${template.content.saveTheDate.monthText} ${template.content.saveTheDate.yearText}`,
            }))}
          />
        </AntdRegistry>
      </div>
    </>
  );
}
