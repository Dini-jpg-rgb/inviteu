"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  HeartOutlined,
  LockOutlined,
  MenuOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useUserManagement } from "@/context/UserManagementContext";
import { landingFaq } from "./landing-faq";
import styles from "./landing-page.module.css";

interface LandingTemplate {
  slug: string;
  name: string;
  themeCategory: string;
  thumbnail: string;
  heroImage: string;
  coupleNames: string;
  eventDate: string;
}

interface LandingPageProps {
  templates: LandingTemplate[];
}

type InvitationCategory =
  | "Minimalist"
  | "Elegant"
  | "Floral"
  | "Rustic"
  | "Modern"
  | "Traditional";

const invitationCategories: InvitationCategory[] = [
  "Minimalist",
  "Elegant",
  "Floral",
  "Rustic",
  "Modern",
  "Traditional",
];

function getInvitationCategory(themeCategory: string): InvitationCategory | null {
  const category = themeCategory.toLowerCase();
  if (category.includes("minimal")) return "Minimalist";
  if (category.includes("luxury") || category.includes("elegant")) return "Elegant";
  if (category.includes("floral")) return "Floral";
  if (category.includes("rustic")) return "Rustic";
  if (category.includes("modern")) return "Modern";
  if (category.includes("traditional")) return "Traditional";
  return null;
}

const featureItems = [
  {
    icon: <PictureOutlined />,
    title: "Galeri cerita",
    text: "Susun foto pilihan dalam galeri yang nyaman dilihat di ponsel maupun desktop.",
  },
  {
    icon: <HeartOutlined />,
    title: "Love story",
    text: "Bagikan perjalanan kisah Anda dalam susunan cerita yang personal.",
  },
  {
    icon: <ClockCircleOutlined />,
    title: "Countdown acara",
    text: "Ajak tamu menantikan hari istimewa dengan hitung mundur acara.",
  },
  {
    icon: <CustomerServiceOutlined />,
    title: "Musik pilihan",
    text: "Lengkapi suasana undangan dengan musik yang sesuai dengan cerita Anda.",
  },
  {
    icon: <TeamOutlined />,
    title: "RSVP dan daftar tamu",
    text: "Pantau konfirmasi kehadiran dan informasi tamu dari satu ruang kerja.",
  },
  {
    icon: <CompassOutlined />,
    title: "Lokasi dan peta",
    text: "Bantu tamu menemukan lokasi acara melalui petunjuk Google Maps.",
  },
  {
    icon: <GiftOutlined />,
    title: "Digital gift",
    text: "Sediakan informasi hadiah digital dengan cara yang praktis dan tertata.",
  },
];

const steps = [
  {
    number: "01",
    title: "Pilih desain",
    text: "Temukan template yang mencerminkan suasana dan cerita hari spesial Anda.",
  },
  {
    number: "02",
    title: "Lengkapi acara",
    text: "Tambahkan nama, waktu, lokasi, galeri, dan detail acara yang ingin dibagikan.",
  },
  {
    number: "03",
    title: "Bagikan undangan",
    text: "Kirim tautan undangan online kepada keluarga dan tamu dengan mudah.",
  },
];

export function LandingPage({ templates }: LandingPageProps) {
  const { packages } = useUserManagement();
  const [selectedCategory, setSelectedCategory] = useState<InvitationCategory | "All">("All");
  const [previewTemplate, setPreviewTemplate] = useState<LandingTemplate | null>(null);
  const featuredTemplate = templates[0];
  const visibleTemplates = templates.filter((template) => (
    selectedCategory === "All"
    || getInvitationCategory(template.themeCategory) === selectedCategory
  ));

  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="InviteU beranda">
            <span className={styles.brandMark}>IU</span>
            <span className={styles.brandText}>
              <strong>InviteU</strong>
              <small>Digital invitation studio</small>
            </span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Navigasi utama">
            <a href="#fitur">Fitur</a>
            <a href="#template">Template</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#paket">Paket</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginLink}>
              Masuk
            </Link>
            <Link href="/register">
              <Button className={styles.headerCta}>
                Mulai sekarang <ArrowRightOutlined />
              </Button>
            </Link>
            <a href="#fitur" className={styles.mobileMenu} aria-label="Lihat fitur">
              <MenuOutlined />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} id="beranda">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                HARI ISTIMEWA, CERITA YANG TAK TERLUPAKAN
              </span>
              <h1>Undangan Digital &amp; Pernikahan Online Elegan</h1>
              <p className={styles.heroDescription}>
                Buat undangan digital pernikahan yang terasa personal, indah di
                setiap layar, dan mudah dibagikan. Kelola detail acara serta
                RSVP dalam satu pengalaman yang lebih sederhana.
              </p>
              <div className={styles.heroActions}>
                <Link href="/register">
                  <Button className={styles.primaryButton}>
                    Buat Undangan Sekarang <ArrowRightOutlined />
                  </Button>
                </Link>
                <a className={styles.textCta} href="#template">
                  Lihat inspirasi <ArrowDownOutlined />
                </a>
              </div>
              <div className={styles.heroNote}>
                <span className={styles.heroNoteRule} aria-hidden="true" />
                <span>DESAIN UNDANGAN · CERITA ANDA</span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-label="Preview undangan InviteU">
              <div className={styles.heroGlow} />
              <div className={styles.desktopMockup}>
                <div className={styles.mockupTopbar}>
                  <span className={styles.windowDots}>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>inviteu.id/our-wedding</span>
                  <LockOutlined />
                </div>
                <div className={styles.desktopInvitation}>
                  <Image
                    src={featuredTemplate?.heroImage ?? "/templates/wedding/couple-main.jpg"}
                    alt={`Foto utama pratinjau ${featuredTemplate?.name ?? "tema undangan InviteU"}`}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 760px) 90vw, 48vw"
                    className={styles.desktopInvitationImage}
                  />
                  <div className={styles.invitationShade} />
                  <div className={styles.invitationText}>
                    <span>THE WEDDING OF</span>
                    <strong>{featuredTemplate?.coupleNames ?? "Your names here"}</strong>
                    <small>Save the date · {featuredTemplate?.eventDate ?? "Your date here"}</small>
                  </div>
                </div>
              </div>

              <div className={styles.phoneMockup}>
                <div className={styles.phoneSpeaker} />
                <div className={styles.phoneScreen}>
                  <Image
                    src={featuredTemplate?.heroImage ?? "/templates/wedding/couple-main.jpg"}
                    alt={`Tampilan smartphone ${featuredTemplate?.name ?? "tema undangan InviteU"}`}
                    fill
                    priority
                    loading="eager"
                    sizes="180px"
                    className={styles.phoneImage}
                  />
                  <div className={styles.phoneShade} />
                  <div className={styles.phoneInvitationText}>
                    <span>YOU ARE INVITED</span>
                    <strong>{featuredTemplate?.coupleNames ?? "Your names here"}</strong>
                    <small>{featuredTemplate?.eventDate ?? "Your date here"}</small>
                    <span className={styles.phoneViewButton}>BUKA UNDANGAN</span>
                  </div>
                </div>
              </div>

              <span className={styles.visualCaption}>
                TEMPLATE PREVIEW <i /> {featuredTemplate?.themeCategory ?? "INVITATION DESIGN"}
              </span>
            </div>
          </div>
          <a className={styles.scrollCue} href="#cerita">
            SCROLL TO EXPLORE <span />
          </a>
        </section>

        <section className={styles.proofSection} aria-label="Ringkasan pengalaman InviteU">
          <div className={styles.proofInner}>
            <span className={styles.sectionKicker}>THE DETAILS, THOUGHTFULLY BROUGHT TOGETHER</span>
            <div className={styles.proofItems}>
              <span>DESIGN THAT FEELS PERSONAL</span>
              <span>EVENT DETAILS IN ONE PLACE</span>
              <span>RSVP &amp; GUEST MANAGEMENT</span>
              <span>EASY TO SHARE</span>
            </div>
          </div>
        </section>

        <section className={styles.storySection} id="cerita">
          <div className={styles.sectionShell}>
            <div className={styles.storyIntro}>
              <span className={styles.sectionKicker}>THE INVITEU DIFFERENCE</span>
              <h2>Lebih dari sekadar undangan.</h2>
              <p>
                Momen penting pantas dirayakan dengan cara yang mudah untuk
                Anda, dan berkesan bagi setiap tamu.
              </p>
            </div>
            <div className={styles.storyRows}>
              <article className={styles.storyRow}>
                <span className={styles.storyIndex}>01</span>
                <div>
                  <h3>Kurangi biaya dan hal yang perlu dicetak</h3>
                  <p>
                    Satu undangan online dapat dibagikan langsung kepada
                    keluarga dan teman tanpa menyiapkan cetakan untuk setiap
                    tamu.
                  </p>
                </div>
                <span className={styles.storyIcon}><SendOutlined /></span>
              </article>
              <article className={styles.storyRow}>
                <span className={styles.storyIndex}>02</span>
                <div>
                  <h3>Bagikan kabar dengan lebih praktis</h3>
                  <p>
                    Kirim tautan undangan melalui kanal pilihan Anda dan
                    pastikan detail acara mudah dibuka di ponsel.
                  </p>
                </div>
                <span className={styles.storyIcon}><HeartOutlined /></span>
              </article>
              <article className={styles.storyRow}>
                <span className={styles.storyIndex}>03</span>
                <div>
                  <h3>Detail acara dan RSVP lebih tertata</h3>
                  <p>
                    Tampilkan waktu, lokasi, galeri, dan informasi penting
                    bersama konfirmasi kehadiran tamu.
                  </p>
                </div>
                <span className={styles.storyIcon}><CalendarOutlined /></span>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.featuresSection} id="fitur">
          <div className={styles.sectionShell}>
            <div className={styles.featuresHeading}>
              <div>
                <span className={styles.sectionKicker}>THOUGHTFUL DETAILS</span>
                <h2>Semua cerita, dalam satu undangan.</h2>
              </div>
              <p>
                Susun pengalaman yang terasa lengkap, dari sapaan pertama
              hingga konfirmasi kehadiran.
              </p>
            </div>

            <div className={styles.featureCanvas}>
              <article className={`${styles.featureCard} ${styles.featureResponsive}`}>
                <span className={styles.featureIcon}><PictureOutlined /></span>
                <span className={styles.featureLabel}>01 / EXPERIENCE</span>
                <h3>Indah di layar apa pun</h3>
                <p>
                  Desain undangan menyesuaikan ponsel dan desktop agar setiap
                  tamu mendapat pengalaman yang nyaman.
                </p>
                <div className={styles.devicePreview} aria-hidden="true">
                  <span className={styles.deviceDesktop}><i /><i /><i /></span>
                  <span className={styles.devicePhone} />
                </div>
              </article>
              <article className={`${styles.featureCard} ${styles.featureGallery}`}>
                <Image
                  src="/templates/wedding/gallery-1.jpg"
                  alt="Contoh foto galeri pasangan dalam undangan"
                  fill
                  sizes="(max-width: 760px) 90vw, 35vw"
                  className={styles.galleryImage}
                />
                <div className={styles.galleryOverlay}>
                  <span className={styles.featureLabel}>02 / YOUR MOMENTS</span>
                  <h3>Galeri yang bercerita</h3>
                  <p>Foto, love story, dan kenangan yang ingin Anda bagikan.</p>
                  <span className={styles.galleryCounter}>01 <i /> 04</span>
                </div>
              </article>
              <article className={`${styles.featureCard} ${styles.featureCountdown}`}>
                <span className={styles.featureIcon}><ClockCircleOutlined /></span>
                <span className={styles.featureLabel}>03 / THE BIG DAY</span>
                <h3>Hitung mundur menuju hari istimewa</h3>
                <p>Tanggal acara menjadi penanda menuju momen yang dinantikan.</p>
              </article>
              <article className={`${styles.featureCard} ${styles.featureRsvp}`}>
                <span className={styles.featureIcon}><TeamOutlined /></span>
                <span className={styles.featureLabel}>04 / STAY IN THE LOOP</span>
                <h3>RSVP tanpa kehilangan kabar</h3>
                <p>Informasi konfirmasi kehadiran tamu lebih mudah dikumpulkan.</p>
              </article>
              <div className={styles.featureListPanel}>
                {featureItems.map((feature) => (
                  <div className={styles.featureListItem} key={feature.title}>
                    <span className={styles.featureListIcon}>{feature.icon}</span>
                    <span>
                      <strong>{feature.title}</strong>
                      <small>{feature.text}</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.templateSection} id="template">
          <div className={styles.sectionShell}>
            <div className={styles.templateHeading}>
              <div>
                <span className={styles.sectionKicker}>FEATURED INVITATION DESIGN</span>
                <h2>Sebuah pratinjau desain, dalam dua ukuran.</h2>
              </div>
              <p>
                Lihat detail tema yang tersedia dalam komposisi desktop dan
                smartphone sebelum menjadikannya inspirasi.
              </p>
            </div>
            {featuredTemplate ? (
              <article className={styles.featuredInvitation}>
                <div className={styles.featuredVisual}>
                  <div className={styles.featuredDesktop}>
                    <div className={styles.featuredBrowserBar}>
                      <span><i /><i /><i /></span>
                      <small>INVITEU · TEMPLATE PREVIEW</small>
                    </div>
                    <div className={styles.featuredDesktopScreen}>
                      <Image
                        src={featuredTemplate.heroImage}
                        alt={`Tampilan desktop tema undangan ${featuredTemplate.name}`}
                        fill
                        sizes="(max-width: 900px) 90vw, 48vw"
                        className={styles.featuredArtwork}
                      />
                      <div className={styles.featuredArtworkShade} />
                      <div className={styles.featuredArtworkText}>
                        <small>THE WEDDING OF</small>
                        <strong>{featuredTemplate.coupleNames}</strong>
                        <span>AN INVITATION TEMPLATE PREVIEW</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.featuredPhone}>
                    <div className={styles.featuredPhoneScreen}>
                      <Image
                        src={featuredTemplate.heroImage}
                        alt={`Tampilan smartphone tema undangan ${featuredTemplate.name}`}
                        fill
                        sizes="180px"
                        className={styles.featuredArtwork}
                      />
                      <div className={styles.featuredArtworkShade} />
                      <div className={styles.featuredPhoneText}>
                        <small>YOU ARE INVITED</small>
                        <strong>{featuredTemplate.coupleNames}</strong>
                        <span>BUKA UNDANGAN</span>
                      </div>
                    </div>
                  </div>
                  <span className={styles.featuredVisualCaption}>
                    Template preview · aset tema yang tersedia
                  </span>
                </div>
                <div className={styles.featuredDetails}>
                  <span className={styles.sectionKicker}>INVITEU TEMPLATE / 01</span>
                  <span className={styles.templatePill}>{featuredTemplate.themeCategory}</span>
                  <h3>{featuredTemplate.name}</h3>
                  <p>
                    Pratinjau visual berdasarkan tema dan foto yang tersedia
                    di project. Ini bukan klaim sebagai undangan pelanggan
                    yang sudah dipublikasikan.
                  </p>
                  <div className={styles.templateActions}>
                    <Button
                      className={styles.secondaryButton}
                      onClick={() => setPreviewTemplate(featuredTemplate)}
                    >
                      View Invitation <ArrowRightOutlined />
                    </Button>
                    <Link href={`/invitations/create?theme=${featuredTemplate.slug}`}>
                      <Button className={styles.templateCta}>Gunakan desain</Button>
                    </Link>
                  </div>
                  <a className={styles.galleryTextLink} href="#gallery">
                    Jelajahi kategori desain <ArrowDownOutlined />
                  </a>
                </div>
              </article>
            ) : (
              <p className={styles.portfolioEmpty}>
                Belum ada tema undangan yang tersedia untuk ditampilkan.
              </p>
            )}
          </div>
        </section>

        <section className={styles.invitationGallerySection} id="gallery">
          <div className={styles.sectionShell}>
            <div className={styles.galleryHeading}>
              <div>
                <span className={styles.sectionKicker}>INVITATION GALLERY</span>
                <h2>Jelajahi desain yang tersedia.</h2>
              </div>
              <p>
                Galeri ini menampilkan tema undangan yang benar-benar sudah
                tersedia, bukan contoh portfolio hasil pelanggan.
              </p>
            </div>
            <div className={styles.galleryFilters} role="group" aria-label="Filter kategori desain">
              <button
                type="button"
                className={selectedCategory === "All" ? styles.galleryFilterActive : styles.galleryFilter}
                aria-pressed={selectedCategory === "All"}
                onClick={() => setSelectedCategory("All")}
              >
                Semua
              </button>
              {invitationCategories.map((category) => (
                <button
                  type="button"
                  className={selectedCategory === category ? styles.galleryFilterActive : styles.galleryFilter}
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  key={category}
                >
                  {category}
                </button>
              ))}
            </div>
            {visibleTemplates.length ? (
              <div className={styles.invitationGalleryGrid}>
                {visibleTemplates.map((template, index) => (
                  <article className={styles.invitationGalleryItem} key={template.slug}>
                    <button
                      className={styles.galleryArtworkButton}
                      type="button"
                      onClick={() => setPreviewTemplate(template)}
                      aria-label={`Preview template ${template.name}`}
                    >
                      <Image
                        src={template.thumbnail}
                        alt={`Aset visual pratinjau template ${template.name}`}
                        fill
                        sizes="(max-width: 760px) 90vw, 50vw"
                        className={styles.galleryArtwork}
                      />
                      <span className={styles.galleryArtworkShade} />
                      <span className={styles.galleryArtworkNames}>{template.coupleNames}</span>
                      <span className={styles.galleryArtworkLabel}>TEMPLATE PREVIEW</span>
                      <span className={styles.galleryArtworkAction}>
                        <PlayCircleOutlined /> Preview
                      </span>
                    </button>
                    <div className={styles.galleryItemDetails}>
                      <div>
                        <span>{getInvitationCategory(template.themeCategory) ?? template.themeCategory}</span>
                        <h3>{template.name}</h3>
                      </div>
                      <Button
                        className={styles.galleryPreviewButton}
                        onClick={() => setPreviewTemplate(template)}
                      >
                        Preview <ArrowRightOutlined />
                      </Button>
                    </div>
                    {index === 0 && templates.length === 1 && (
                      <p className={styles.galleryItemNote}>
                        Satu tema tersedia saat ini · pratinjau template, bukan hasil publikasi pelanggan.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.portfolioEmpty} role="status">
                {selectedCategory === "All"
                  ? "Belum ada tema undangan yang tersedia untuk ditampilkan."
                  : `Belum ada tema yang sesuai dengan kategori ${selectedCategory}. Desain akan muncul di sini setelah tersedia.`}
              </div>
            )}
          </div>
        </section>

        <section className={styles.stepsSection} id="cara-kerja">
          <div className={styles.sectionShell}>
            <div className={styles.stepsHeader}>
              <span className={styles.sectionKicker}>SIMPLE BY DESIGN</span>
              <h2>Dari ide ke undangan, dalam tiga langkah.</h2>
            </div>
            <div className={styles.stepsLayout}>
              {steps.map((step, index) => (
                <article className={styles.step} key={step.number}>
                  <span className={styles.stepNumber}>{step.number}</span>
                  <div className={styles.stepLine} aria-hidden="true">
                    <span />
                    {index < steps.length - 1 && <i />}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
              <div className={styles.stepsAside}>
                <span className={styles.stepsAsideIcon}><HeartOutlined /></span>
                <p>Made for the moments that matter.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.pricingSection} id="paket">
          <div className={styles.sectionShell}>
            <div className={styles.pricingHeading}>
              <span className={styles.sectionKicker}>CLEAR &amp; SIMPLE</span>
              <h2>Pilih paket yang sesuai.</h2>
              <p>
                Harga dan fitur ditampilkan sesuai data paket InviteU saat ini.
              </p>
            </div>
            {packages.length ? (
              <div className={styles.pricingGrid}>
                {packages.map((pkg, index) => (
                  <article
                    className={`${styles.pricePlan} ${index === 1 ? styles.pricePlanFeatured : ""}`}
                    key={pkg.id}
                  >
                    {index === 1 && <span className={styles.popularBadge}>Pilihan partner</span>}
                    <span className={styles.planName}>{pkg.name}</span>
                    <strong className={styles.planPrice}>{pkg.price}</strong>
                    <span className={styles.planNote}>{pkg.priceNote}</span>
                    <span className={styles.planDivider} />
                    <ul>
                      {pkg.features.map((feature) => (
                        <li key={feature}><CheckOutlined /> {feature}</li>
                      ))}
                    </ul>
                    <Link href="/register" className={styles.planAction}>
                      <Button className={index === 1 ? styles.primaryButton : styles.secondaryButton}>
                        Mulai dengan {pkg.name} <ArrowRightOutlined />
                      </Button>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.noPackages}>
                Informasi paket belum tersedia saat ini.
              </p>
            )}
            <p className={styles.pricingFootnote}>
              Informasi paket dapat berubah mengikuti pengaturan InviteU.
            </p>
          </div>
        </section>

        <section className={styles.faqSection} id="faq">
          <div className={styles.sectionShell}>
            <div className={styles.faqIntro}>
              <span className={styles.sectionKicker}>A FEW THINGS TO KNOW</span>
              <h2>Pertanyaan yang sering muncul.</h2>
              <p>Masih ada yang ingin ditanyakan? Kami siap membantu Anda memulai.</p>
              <Link href="/register" className={styles.faqLink}>
                Mulai bersama InviteU <ArrowRightOutlined />
              </Link>
            </div>
            <div className={styles.faqList}>
              {landingFaq.map(({ question, answer }, index) => (
                <details className={styles.faqItem} key={question}>
                  <summary>
                    <span className={styles.faqIndex}>0{index + 1}</span>
                    <strong>{question}</strong>
                    <span className={styles.faqToggle} aria-hidden="true">+</span>
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalCtaContent}>
            <span className={styles.sectionKicker}>YOUR STORY, BEAUTIFULLY TOLD</span>
            <h2>Hari istimewa Anda dimulai dari sebuah undangan.</h2>
            <p>
              Buat ruang untuk cerita Anda. Kami bantu membagikannya dengan
              cara yang lebih berarti.
            </p>
            <Link href="/register">
              <Button className={styles.finalCtaButton}>
                Buat Undangan Sekarang <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer} id="footer">
        <div className={styles.footerTop}>
          <div className={styles.footerBrandBlock}>
            <Link className={styles.brand} href="/" aria-label="InviteU beranda">
              <span className={styles.brandMark}>IU</span>
              <span className={styles.brandText}>
                <strong>InviteU</strong>
                <small>Digital invitation studio</small>
              </span>
            </Link>
            <p>
              Cara yang lebih personal untuk mengundang orang-orang terdekat
              ke hari istimewa Anda.
            </p>
          </div>
          <div className={styles.footerNav}>
            <strong>Jelajahi</strong>
            <a href="#fitur">Fitur</a>
            <a href="#template">Template</a>
            <a href="#paket">Paket</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className={styles.footerNav}>
            <strong>Ruang kerja</strong>
            <Link href="/login">Masuk</Link>
            <Link href="/register">Daftar partner</Link>
          </div>
          <div className={styles.footerNav}>
            <strong>Informasi</strong>
            <span>Kebijakan Privasi</span>
            <span>Syarat &amp; Ketentuan</span>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} InviteU. Dibuat untuk momen istimewa.</span>
          <a href="#beranda">Kembali ke atas ↑</a>
        </div>
      </footer>

      {previewTemplate && (
        <Modal
          open={Boolean(previewTemplate)}
          title={previewTemplate.name}
          onCancel={() => setPreviewTemplate(null)}
          footer={
            <Link href={`/invitations/create?theme=${previewTemplate.slug}`}>
              <Button className={styles.primaryButton}>
                Gunakan desain <ArrowRightOutlined />
              </Button>
            </Link>
          }
          width={760}
          className={styles.previewModal}
        >
          <div className={styles.previewModalImage}>
            <Image
              src={previewTemplate.heroImage}
              alt={`Aset visual pratinjau template ${previewTemplate.name}`}
              fill
              sizes="(max-width: 760px) 90vw, 700px"
              className={styles.templateImage}
            />
            <div className={styles.previewModalShade} />
            <div className={styles.previewModalNames}>
              <span>THE WEDDING OF</span>
              <strong>{previewTemplate.coupleNames}</strong>
              <small>{previewTemplate.themeCategory} · Template preview</small>
            </div>
          </div>
          <p>
            Demo undangan publik untuk tema ini belum tersedia. Ini adalah
            pratinjau visual dari aset dan tema yang tersedia di InviteU.
          </p>
        </Modal>
      )}
    </div>
  );
}
