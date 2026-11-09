// Endpoint publik untuk memuat undangan berdasarkan slug belum tersedia di backend.
export default async function GuestInvitationPage(
  props: PageProps<"/[slug]">
) {
  const { slug } = await props.params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          InviteU
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-stone-900">
          Undangan belum dapat ditampilkan
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Data undangan publik untuk tautan{" "}
          <span className="font-medium text-stone-800">{slug}</span> belum
          tersedia. Silakan coba kembali nanti.
        </p>
      </section>
    </main>
  );
}
