// Halaman undangan publik — route dinamis berdasarkan slug
// params adalah Promise di Next.js 16+ (harus di-await)
export default async function GuestInvitationPage(
  props: PageProps<"/[slug]">
) {
  const { slug } = await props.params;

  return (
    <main>
      <h1>Halaman Undangan: {slug}</h1>
      <p>Menampilkan undangan dengan slug: <strong>{slug}</strong></p>
    </main>
  );
}
