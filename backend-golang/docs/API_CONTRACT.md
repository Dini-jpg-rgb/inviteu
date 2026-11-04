# InviteU — API Contract

**Status:** Draft — diperbarui untuk Modul Template dan Undangan  
**Base URL:** `/api/v1`  
**Backend:** Go, Gin, PostgreSQL

## 1. Tujuan

Dokumen ini menjadi acuan bersama bagi Developer A dan Developer B dalam membangun API InviteU agar format endpoint, response, autentikasi, otorisasi, dan penanganan error tetap konsisten.

Perubahan kontrak harus dikomunikasikan sebelum implementasi yang terdampak dilakukan.

## 2. Aturan Umum

- Semua endpoint API baru menggunakan prefix `/api/v1`.
- Request dan response menggunakan JSON kecuali endpoint upload file atau kebutuhan khusus lainnya.
- Nama properti JSON menggunakan `snake_case`.
- **Penanganan Input Tidak Valid**: Seluruh input pengguna yang tidak valid, format salah, atau melanggar batasan sintaksis dibalas dengan HTTP status code `400 Bad Request` (keputusan arsitektur tim backend; status code `422 Unprocessable Content` tidak digunakan pada modul ini).
- **Format Waktu dan Timestamp**: Kolom waktu pada database PostgreSQL menggunakan tipe `timestamp without time zone`. Library database (pgx v5) menetapkan zona UTC saat serialisasi sehingga JSON berakhiran `Z`, meskipun database lokal beroperasi pada zona Asia/Makassar (WITA). Hal ini dicatat sebagai catatan teknis yang diketahui (*known technical debt*) dan belum diseragamkan.
- **Format Tanggal dan Jam Acara**: Tanggal acara (`events.date`) wajib berformat `YYYY-MM-DD`, dan waktu acara (`start_time`, `end_time`) berformat `HH:mm` atau `HH:mm:ss`.
- **Format Harga (*Price*)**: Kolom harga pada template dikembalikan bertipe `string` di JSON (hasil konversi dari tipe SQL `NUMERIC` via `price::text`) untuk menghindari hilangnya presisi angka desimal pada representasi *floating point*.
- **Status Undangan**: Status undangan pada database dan JSON konsisten menggunakan huruf kecil (*lowercase*), yaitu `draft`, `published`, dan `expired`.
- Gunakan HTTP status code sesuai hasil operasi.
- Endpoint privat wajib memeriksa autentikasi.
- Hak akses wajib diperiksa di backend, bukan hanya di frontend.
- Query database harus menggunakan parameter, bukan menggabungkan input pengguna langsung ke SQL.
- Password, token rahasia, dan kredensial tidak boleh ditulis ke log.

## 3. Format Response

### 3.1 Response Sukses

Contoh response `200 OK`:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "id": 1,
    "name": "Example"
  }
}
```

`data` menyesuaikan hasil endpoint. Untuk endpoint daftar, `data` dapat berupa array atau objek pembungkus koleksi dan pagination.

### 3.2 Response Error

Contoh response validasi `400 Bad Request`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "title cannot be empty"
  }
}
```

Untuk error umum yang tidak berkaitan dengan validasi per field, properti `errors` dapat berupa penanda spesifik (misalnya `{"package": "quota_exhausted"}`) atau tidak disertakan jika pesan utama pada `message` sudah mencukupi.

### 3.3 HTTP Status Code

- `200 OK`: operasi berhasil.
- `201 Created`: resource berhasil dibuat.
- `204 No Content`: operasi berhasil tanpa response body.
- `400 Bad Request`: request tidak valid, parsing JSON gagal, parameter di luar batas, atau validasi input gagal.
- `401 Unauthorized`: pengguna belum terautentikasi atau token tidak valid.
- `403 Forbidden`: pengguna tidak memiliki izin/role yang sesuai, atau paket/kuota tidak mencukupi.
- `404 Not Found`: resource tidak ditemukan atau bukan milik pengguna tersebut (perlindungan kepemilikan).
- `409 Conflict`: konflik status resource (misalnya mengedit undangan non-draft, duplikasi slug, atau duplikasi favorit).
- `429 Too Many Requests`: batas request terlampaui.
- `500 Internal Server Error`: kesalahan internal server atau database yang tidak terduga.

Semua error harus menggunakan format JSON yang konsisten, kecuali endpoint yang memang memiliki kebutuhan khusus.

## 4. Autentikasi dan Otorisasi

Role utama InviteU:

- `partner`: mengelola akun partner, paket yang dimiliki, pesanan, dan undangan miliknya.
- `designer`: mengelola template, tugas desain, dan revisi yang ditugaskan kepadanya.
- `admin`: mengakses fungsi administrasi sesuai kewenangannya.

Endpoint publik tidak memerlukan autentikasi. Endpoint privat wajib memeriksa identitas pengguna dan kepemilikan resource:
- Header autentikasi: `Authorization: Bearer <jwt_token>`.
- Pemeriksaan kepemilikan data: resource milik pengguna lain dibalas `404 Not Found` (bukan `403 Forbidden`) untuk mencegah *user enumeration*.

---

## 5. Spesifikasi Endpoint

### 5.1 Autentikasi dan Profil — Developer A

| Method | Endpoint                       | Akses                           |
| ------ | ------------------------------ | ------------------------------- |
| POST   | `/api/v1/auth/register`        | Publik                          |
| POST   | `/api/v1/auth/login`           | Publik                          |
| POST   | `/api/v1/auth/logout`          | Pengguna terautentikasi         |
| POST   | `/api/v1/auth/forgot-password` | Publik                          |
| POST   | `/api/v1/auth/reset-password`  | Publik dengan token reset valid |
| GET    | `/api/v1/users/me`             | Pengguna terautentikasi         |
| PATCH  | `/api/v1/users/me`             | Pengguna terautentikasi         |

Login Google akan memiliki kontrak tersendiri setelah alur OAuth disepakati.

### 5.2 Paket dan Transaksi — Developer A

| Method | Endpoint                    | Akses                                    |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/api/v1/packages`          | Publik                                   |
| GET    | `/api/v1/packages/:id`      | Publik                                   |
| GET    | `/api/v1/users/me/packages` | Partner                                  |
| POST   | `/api/v1/orders`            | Partner                                  |
| GET    | `/api/v1/orders`            | Partner                                  |
| GET    | `/api/v1/orders/:id`        | Pemilik order atau admin sesuai izin     |
| GET    | `/api/v1/invoices/:id`      | Pemilik invoice atau admin sesuai izin   |
| POST   | `/api/v1/payments`          | Partner dengan order yang valid          |
| GET    | `/api/v1/payments/:id`      | Pemilik transaksi atau admin sesuai izin |

Pembayaran harus memvalidasi harga dan status order di backend. Status pembayaran hanya boleh dikonfirmasi melalui mekanisme yang tepercaya, seperti verifikasi callback atau webhook payment gateway.

---

### 5.3 Katalog Template dan Favorit — Developer B

Ringkasan endpoint template dan favorit:

| Method | Endpoint                                  | Akses                   | Keterangan |
| ------ | ----------------------------------------- | ----------------------- | ---------- |
| GET    | `/api/v1/templates/categories`            | Publik                  | Daftar kategori template |
| GET    | `/api/v1/templates`                       | Publik                  | Katalog template dengan pencarian, filter, dan pagination |
| GET    | `/api/v1/templates/:id`                   | Publik                  | Detail lengkap template berstatus publish |
| GET    | `/api/v1/users/me/favorites`              | Pengguna terautentikasi | Daftar template favorit milik pengguna |
| POST   | `/api/v1/users/me/favorites`              | Pengguna terautentikasi | Menambahkan template ke favorit |
| DELETE | `/api/v1/users/me/favorites/:template_id` | Pengguna terautentikasi | Menghapus template dari favorit |

#### 5.3.1 GET /api/v1/templates/categories
- **Akses**: Publik.
- **Query Parameter**: Tidak ada.
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Template categories retrieved successfully",
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Wedding",
        "slug": "wedding",
        "description": "Template untuk pernikahan"
      }
    ]
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Kategori berhasil diambil (bisa berupa array kosong jika belum ada data). |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Diurutkan berdasarkan `name ASC, id ASC`.

#### 5.3.2 GET /api/v1/templates
- **Akses**: Publik.
- **Query Parameters**:
  - `page` (integer, opsional, default `1`): Nomor halaman. Wajib `>= 1`. Nilai `< 1` atau bukan angka menghasilkan `400 Bad Request`.
  - `limit` (integer, opsional, default `12`): Jumlah item per halaman. Wajib `>= 1`. Nilai `< 1` menghasilkan `400 Bad Request`. Nilai `> 50` otomatis dipotong (*capped*) menjadi `50`.
  - `category` (string, opsional): Filter berdasarkan slug kategori (`tc.slug`).
  - `q` (string, opsional): Pencarian nama template (`t.name ILIKE %q%`). Maksimum 100 karakter. Karakter `%`, `_`, dan `\` di-escape secara aman. Lebih dari 100 karakter menghasilkan `400 Bad Request`.
  - `min_price` (number, opsional): Batas harga minimum. Wajib angka non-negatif dan berhingga. Nilai negatif, NaN, atau Inf menghasilkan `400 Bad Request`.
  - `max_price` (number, opsional): Batas harga maksimum. Wajib angka non-negatif dan berhingga. Jika `min_price > max_price`, menghasilkan `400 Bad Request`.
  - `style` (string, opsional): Filter gaya template (pencocokan *case-insensitive*). Maksimum 100 karakter.
  - `color` (string, opsional): Filter warna utama template (*case-insensitive*). Maksimum 100 karakter.
  - `sort` (string, opsional, default `newest`): Pengurutan data. Whitelist yang diterima:
    - `newest`: `t.created_at DESC, t.id DESC`
    - `price_asc`: `t.price ASC, t.id ASC`
    - `price_desc`: `t.price DESC, t.id ASC`
    - `name_asc`: `t.name ASC, t.id ASC`
    Nilai di luar whitelist menghasilkan `400 Bad Request`.
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": {
    "templates": [
      {
        "id": 15,
        "name": "Complete Modern Wedding",
        "slug": "complete-modern-wedding",
        "description": "Template modern dengan 3 section lengkap",
        "price": "150000.00",
        "style": "Modern Minimalist",
        "color": "Sage Green",
        "thumbnail_file_id": 42,
        "category": {
          "id": 1,
          "name": "Wedding",
          "slug": "wedding"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "total_pages": 1
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Template berhasil diambil sesuai filter dan pagination. |
| `400 Bad Request` | Parameter tidak valid (`page < 1`, `limit < 1`, `q > 100`, harga negatif/NaN, `min_price > max_price`, `style/color > 100`, `sort` di luar whitelist). |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya menampilkan template dengan status `"publish"` (`t.status = 'publish'`).
  - Kolom `price` bertipe string dari PostgreSQL `NUMERIC` (`t.price::text`).
  - Limit di atas 50 otomatis dipotong menjadi 50 tanpa melempar error.

#### 5.3.3 GET /api/v1/templates/:id
- **Akses**: Publik.
- **Path Parameter**:
  - `id` (integer, wajib): ID template. Wajib integer positif `>= 1`. Nilai `< 1` menghasilkan `400 Bad Request`.
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Template retrieved successfully",
  "data": {
    "template": {
      "id": 15,
      "name": "Complete Modern Wedding",
      "slug": "complete-modern-wedding",
      "description": "Template lengkap dengan section cover dan jadwal",
      "price": "150000.00",
      "style": "Modern Minimalist",
      "color": "Sage Green",
      "thumbnail_file_id": 10,
      "category": {
        "id": 1,
        "name": "Wedding",
        "slug": "wedding"
      },
      "sections": [
        {
          "id": 6,
          "name": "Cover",
          "type": "cover",
          "sort_order": 10,
          "is_required": true,
          "is_editable": true,
          "settings": {
            "theme": "sage",
            "layout": "hero"
          },
          "fields": [
            {
              "id": 5,
              "field_key": "groom-name",
              "label": "Nama Mempelai Pria",
              "field_type": "text",
              "default_value": "Raka",
              "is_required": true,
              "is_editable": true,
              "sort_order": 10,
              "validation_rules": {
                "maxLength": 100
              }
            }
          ]
        }
      ],
      "assets": [
        {
          "id": 1,
          "asset_type": "background",
          "asset_key": "bg-hero",
          "storage_file_id": 101,
          "sort_order": 10
        }
      ]
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Detail template berhasil diambil. |
| `400 Bad Request` | `:id` bukan integer positif. |
| `404 Not Found` | Template tidak ditemukan atau status template bukan `"publish"`. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya menampilkan template yang berstatus `"publish"`.
  - Sections diurutkan berdasarkan `sort_order ASC, id ASC`.
  - Fields di dalam section diurutkan berdasarkan `s.sort_order ASC, s.id ASC, f.sort_order ASC, f.id ASC`.
  - Assets diurutkan berdasarkan `sort_order ASC, id ASC`.

#### 5.3.4 GET /api/v1/users/me/favorites
- **Akses**: Pengguna terautentikasi (semua role: `partner`, `designer`, `admin`).
- **Query Parameters**:
  - `page` (integer, opsional, default `1`): Wajib `>= 1`.
  - `limit` (integer, opsional, default `12`): Wajib `>= 1`, maks `50` (dipotong jika lebih).
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Template favorites retrieved successfully",
  "data": {
    "templates": [
      {
        "id": 15,
        "name": "Complete Modern Wedding",
        "slug": "complete-modern-wedding",
        "description": "Template modern",
        "price": "150000.00",
        "style": "Modern Minimalist",
        "color": "Sage Green",
        "thumbnail_file_id": 10,
        "category": {
          "id": 1,
          "name": "Wedding",
          "slug": "wedding"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "total_pages": 1
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Daftar favorit berhasil diambil. |
| `400 Bad Request` | Parameter `page` atau `limit` tidak valid. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya menampilkan template favorit yang saat ini masih berstatus `"publish"`.
  - Diurutkan berdasarkan waktu penambahan favorit terbaru (`favorite.created_at DESC, favorite.id DESC`).

#### 5.3.5 POST /api/v1/users/me/favorites
- **Akses**: Pengguna terautentikasi (semua role).
- **Request Body**:
```json
{
  "template_id": 15
}
```
- **Validasi**: `template_id` wajib berupa integer positif `>= 1`.
- **Respons Sukses `201 Created`**:
```json
{
  "success": true,
  "message": "Template added to favorites",
  "data": {
    "favorite": {
      "template_id": 15
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `201 Created` | Template berhasil ditambahkan ke daftar favorit pengguna. |
| `400 Bad Request` | Body JSON tidak valid atau `template_id` bukan integer positif. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `404 Not Found` | Template tidak ditemukan atau status template bukan `"publish"`. |
| `409 Conflict` | Template tersebut sudah ada di daftar favorit pengguna. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |

#### 5.3.6 DELETE /api/v1/users/me/favorites/:template_id
- **Akses**: Pengguna terautentikasi (semua role).
- **Path Parameter**:
  - `template_id` (integer, wajib): ID template yang dihapus dari favorit (wajib `>= 1`).
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Favorite removed successfully"
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Template favorit berhasil dihapus. |
| `400 Bad Request` | `:template_id` bukan integer positif. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `404 Not Found` | Data favorit tidak ditemukan (belum difavoritkan atau milik user lain). |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |

---

### 5.4 Undangan dan Builder — Developer B

Ringkasan endpoint undangan dan builder:

| Method | Endpoint                            | Akses   | Keterangan | Status Implementasi |
| ------ | ----------------------------------- | ------- | ---------- | ------------------- |
| POST   | `/api/v1/invitations`               | Partner | Membuat undangan baru (draft) beserta event awal | Diimplementasikan |
| GET    | `/api/v1/invitations`               | Partner | Melihat daftar undangan milik partner | Diimplementasikan |
| GET    | `/api/v1/invitations/:id`           | Partner | Melihat detail undangan dan event miliknya | Diimplementasikan |
| PATCH  | `/api/v1/invitations/:id`           | Partner | Memperbarui judul, slug, dan data event (draft) | Diimplementasikan |
| GET    | `/api/v1/invitations/:id/content`   | Partner | Membaca struktur section, field, dan nilai konten | Diimplementasikan |
| PATCH  | `/api/v1/invitations/:id/content`   | Partner | Menyimpan/memperbarui isi field konten (draft) | Diimplementasikan |
| GET    | `/api/v1/invitations/:id/versions`  | Partner | Riwayat versi undangan | *Belum diimplementasikan* |
| POST   | `/api/v1/invitations/:id/publish`   | Partner | Publikasi undangan dan pemotongan kuota | *Belum diimplementasikan* |

#### 5.4.1 POST /api/v1/invitations
- **Akses**: Partner terautentikasi (`RequireRole("partner")`).
- **Request Body**:
```json
{
  "title": "The Wedding of Raka & Alya",
  "template_id": 15,
  "slug": "raka-dan-alya",
  "event": {
    "name": "Resepsi Pernikahan",
    "date": "2026-12-25",
    "start_time": "10:00",
    "end_time": "14:00",
    "location": "Grand Ballroom Hotel Indonesia",
    "address": "Jl. M.H. Thamrin No. 1, Jakarta",
    "maps_url": "https://maps.google.com/...",
    "description": "Dress code: Formal pastel"
  }
}
```
- **Validasi Input**:
  - `title` (string, wajib): Maksimum 255 karakter, tidak boleh kosong/hanya spasi.
  - `template_id` (integer, wajib): Wajib integer positif (`> 0`), template harus berstatus `"publish"`.
  - `slug` (string, opsional): Karakter huruf kecil, angka, dan tanda hubung tunggal (regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`), maksimum 255 karakter. Jika tidak disertakan, slug otomatis dibuat dari judul dengan sufiks 4 karakter heksadesimal acak (maksimal 3 kali percobaan penanganan bentrok).
  - `event` (object, wajib):
    - `name` (string, opsional): Jika kosong/tidak diisi, otomatis bernilai sama dengan `title`, maksimum 255 karakter.
    - `date` (string, wajib): Format wajib `YYYY-MM-DD`.
    - `start_time` (string, opsional): Format `HH:MM` atau `HH:MM:SS`.
    - `end_time` (string, opsional): Format `HH:MM` atau `HH:MM:SS`. Jika keduanya ada, `end_time` wajib `>= start_time`.
    - `location` (string, opsional): Maksimum 255 karakter.
    - `address`, `maps_url`, `description` (string, opsional).
- **Respons Sukses `201 Created`**:
```json
{
  "success": true,
  "message": "Invitation created successfully",
  "data": {
    "invitation": {
      "id": 1,
      "title": "The Wedding of Raka & Alya",
      "slug": "raka-dan-alya",
      "status": "draft",
      "template": {
        "id": 15,
        "name": "Complete Modern Wedding"
      },
      "event": {
        "id": 1,
        "name": "Resepsi Pernikahan",
        "date": "2026-12-25",
        "start_time": "10:00",
        "end_time": "14:00",
        "location": "Grand Ballroom Hotel Indonesia",
        "address": "Jl. M.H. Thamrin No. 1, Jakarta",
        "maps_url": "https://maps.google.com/...",
        "description": "Dress code: Formal pastel"
      },
      "created_at": "2026-11-02T11:00:00Z",
      "updated_at": "2026-11-02T11:00:00Z"
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `201 Created` | Undangan berhasil dibuat berstatus draft. |
| `400 Bad Request` | Body JSON salah, field wajib kosong, format tanggal/jam tidak valid, atau `end_time < start_time`. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role bukan `partner`, partner tidak memiliki paket aktif (`errors.package = "no_active_package"`), atau kuota paket habis (`errors.package = "quota_exhausted"`). |
| `404 Not Found` | Template tidak ditemukan atau statusnya bukan `"publish"`. |
| `409 Conflict` | Slug custom sudah digunakan oleh undangan lain (`errors.slug = "slug_already_taken"`), atau pembuatan slug otomatis gagal setelah 3 kali retry. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Undangan baru selalu diinisialisasi dengan status `'draft'`.
  - Otomatis membuat baris `invitation_versions` versi 1 berstatus `'draft'`.
  - **Aturan Kuota**: Kuota undangan (`invitation_used`) **TIDAK berkurang** saat membuat draft. Kuota hanya berkurang pada tahap publikasi (Fitur 4.1).

#### 5.4.2 GET /api/v1/invitations
- **Akses**: Partner terautentikasi (`RequireRole("partner")`).
- **Query Parameters**:
  - `page` (integer, opsional, default `1`): Wajib `>= 1`.
  - `limit` (integer, opsional, default `12`): Wajib `>= 1`, maks `50` (dipotong jika lebih).
  - `status` (string, opsional): Filter status undangan. Nilai yang didukung: `all`, `draft`, `published`, `expired`. Nilai di luar itu menghasilkan `400 Bad Request`.
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Invitations retrieved successfully",
  "data": {
    "invitations": [
      {
        "id": 1,
        "title": "The Wedding of Raka & Alya",
        "slug": "raka-dan-alya",
        "status": "draft",
        "created_at": "2026-11-02T11:00:00Z",
        "updated_at": "2026-11-02T11:00:00Z",
        "template": {
          "id": 15,
          "name": "Complete Modern Wedding"
        },
        "event": {
          "id": 1,
          "name": "Resepsi Pernikahan",
          "date": "2026-12-25",
          "start_time": "10:00",
          "end_time": "14:00",
          "location": "Grand Ballroom Hotel Indonesia"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "total_pages": 1
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Daftar undangan milik partner berhasil diambil. |
| `400 Bad Request` | Parameter `page`, `limit`, atau `status` tidak valid. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role pengguna bukan `partner`. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya menampilkan undangan milik partner yang bersangkutan (`WHERE user_id = $1`).
  - Diurutkan berdasarkan `created_at DESC, id DESC`.

#### 5.4.3 GET /api/v1/invitations/:id
- **Akses**: Partner terautentikasi (`RequireRole("partner")`).
- **Path Parameter**:
  - `id` (integer, wajib): ID undangan (wajib `>= 1`).
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Invitation retrieved successfully",
  "data": {
    "invitation": {
      "id": 1,
      "title": "The Wedding of Raka & Alya",
      "slug": "raka-dan-alya",
      "status": "draft",
      "published_version_id": null,
      "published_at": null,
      "expired_at": null,
      "template": {
        "id": 15,
        "name": "Complete Modern Wedding",
        "slug": "complete-modern-wedding"
      },
      "event": {
        "id": 1,
        "name": "Resepsi Pernikahan",
        "description": "Dress code: Formal pastel",
        "date": "2026-12-25",
        "start_time": "10:00",
        "end_time": "14:00",
        "location": "Grand Ballroom Hotel Indonesia",
        "address": "Jl. M.H. Thamrin No. 1, Jakarta",
        "maps_url": "https://maps.google.com/..."
      },
      "created_at": "2026-11-02T11:00:00Z",
      "updated_at": "2026-11-02T11:00:00Z"
    }
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Detail undangan berhasil diambil. |
| `400 Bad Request` | `:id` bukan integer positif. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role pengguna bukan `partner`. |
| `404 Not Found` | Undangan tidak ditemukan atau milik partner lain. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Undangan milik partner lain dibalas `404 Not Found` (bukan 403) sesuai aturan keamanan kepemilikan resource.

#### 5.4.4 PATCH /api/v1/invitations/:id
- **Akses**: Partner pemilik undangan (`RequireRole("partner")`).
- **Path Parameter**:
  - `id` (integer, wajib): ID undangan (wajib `>= 1`).
- **Request Body** (minimal 1 field diisi):
```json
{
  "title": "The Wedding of Raka & Alya - Resepsi",
  "slug": "raka-dan-alya-resepsi",
  "event": {
    "name": "Resepsi Mewah",
    "date": "2026-12-26",
    "start_time": "11:00",
    "end_time": "15:00",
    "location": "The Ritz-Carlton",
    "address": "Mega Kuningan, Jakarta",
    "maps_url": "https://maps.google.com/test",
    "description": "Dress code: Black Tie"
  }
}
```
- **Validasi Input**:
  - Body tidak boleh kosong (`{}` atau `{"event":{}}` tanpa properti menghasilkan `400 Bad Request`).
  - `template_id`: tidak dapat diubah setelah undangan dibuat. Jika dikirim berbeda dari template saat ini, menghasilkan `400 Bad Request` (`errors.template_id = "template_id cannot be changed"`).
  - `title`: opsional, string tidak kosong, maksimum 255 karakter.
  - `slug`: opsional, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, maksimum 255 karakter.
  - `event.name`: opsional, string tidak kosong, maksimum 255 karakter.
  - `event.date`: opsional, format `YYYY-MM-DD`.
  - `event.start_time` / `event.end_time`: opsional, format `HH:MM` atau `HH:MM:SS`, `end_time` wajib `>= start_time`.
  - `event.location`: opsional, maksimum 255 karakter.
- **Respons Sukses `200 OK`**: Mengembalikan objek undangan lengkap yang telah diperbarui (format sama seperti `GET /invitations/:id`).
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Undangan dan event berhasil diperbarui. |
| `400 Bad Request` | Body kosong, `template_id` diubah, format tanggal/jam tidak valid, atau `end_time < start_time`. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role pengguna bukan `partner`. |
| `404 Not Found` | Undangan tidak ditemukan atau milik partner lain. |
| `409 Conflict` | Undangan bukan berstatus `'draft'` (`errors.status = "invitation_is_not_draft"`), atau slug baru sudah digunakan oleh undangan lain (`errors.slug = "slug_already_taken"`). |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya dapat dijalankan pada undangan berstatus `'draft'`. Undangan non-draft dibalas `409 Conflict`.
  - Data event diperbarui secara atomik melalui join tabel relasi `invitation_events`.
  - Kolom `updated_at` pada tabel `invitations` dan `events` ikut diperbarui ke waktu transaksi.

#### 5.4.5 GET /api/v1/invitations/:id/content
- **Akses**: Partner pemilik undangan (`RequireRole("partner")`).
- **Path Parameter**:
  - `id` (integer, wajib): ID undangan (wajib `>= 1`).
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Invitation content retrieved successfully",
  "data": {
    "invitation_id": 1,
    "version": {
      "id": 1,
      "version_number": 1,
      "status": "draft"
    },
    "template_id": 15,
    "sections": [
      {
        "id": 6,
        "name": "Cover",
        "type": "cover",
        "sort_order": 10,
        "is_required": true,
        "is_editable": true,
        "settings": {
          "theme": "sage",
          "layout": "hero"
        },
        "fields": [
          {
            "id": 5,
            "field_key": "groom-name",
            "label": "Nama Mempelai Pria",
            "field_type": "text",
            "default_value": "Raka",
            "value": "Raka Pratama",
            "is_required": true,
            "is_editable": true,
            "sort_order": 10,
            "validation_rules": {
              "maxLength": 100
            }
          }
        ]
      }
    ]
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Konten undangan berhasil diambil. |
| `400 Bad Request` | `:id` bukan integer positif. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role pengguna bukan `partner`. |
| `404 Not Found` | Undangan tidak ditemukan atau milik partner lain. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Berlaku untuk undangan milik sendiri pada **semua status** (`draft`, `published`, `expired`).
  - Mengembalikan versi kerja: versi `'draft'` jika ada, atau versi published (`published_version_id`) jika tidak ada draft aktif.
  - Nilai field (`value`) digabungkan secara otomatis: jika belum ada nilai yang disimpan di `invitation_contents`, field `value` otomatis mengembalikan `default_value` dari `template_fields` (`COALESCE(ic.value, f.default_value)`).
  - Sections dan fields diurutkan berdasarkan `sort_order ASC, id ASC`.

#### 5.4.6 PATCH /api/v1/invitations/:id/content
- **Akses**: Partner pemilik undangan (`RequireRole("partner")`).
- **Path Parameter**:
  - `id` (integer, wajib): ID undangan (wajib `>= 1`).
- **Request Body**:
```json
{
  "fields": [
    {
      "field_id": 5,
      "value": "Raka Pratama"
    },
    {
      "field_id": 6,
      "value": "2026-11-20"
    },
    {
      "field_id": 7,
      "value": ""
    }
  ]
}
```
- **Validasi Input**:
  - `fields` (array, wajib): Berisi minimal 1 field dan maksimal 200 field. Kurang dari 1 atau lebih dari 200 menghasilkan `400 Bad Request`.
  - Duplikasi `field_id` dalam satu request dilarang (menghasilkan `400 Bad Request`).
  - Validasi field dieksekusi dalam **satu query** (`tf.id = ANY($1) AND ts.template_id = template_undangan`): field yang bukan milik template undangan tersebut ditolak dengan `400 Bad Request`.
  - Field atau section dengan `is_editable = false` tidak dapat diubah (dibalas `400 Bad Request`).
  - Batas panjang nilai: maksimal 5000 karakter (rune) untuk seluruh field.
  - **Nilai Kosong**: Nilai `null` atau `""` menghapus baris dari tabel `invitation_contents` sehingga saat dibaca kembali via GET otomatis menampilkan `default_value` template. Tidak ada validasi format untuk nilai yang dikosongkan.
  - **Validasi Format**: Nilai yang tidak kosong divalidasi terhadap `validation_rules` (`maxLength`, format `YYYY-MM-DD`, format `HH:mm`) atau tipe field (`date`, `time`).
  - **Aturan `is_required`**: `is_required` **TIDAK** ditegakkan pada endpoint ini (draf diizinkan belum lengkap untuk mendukung *auto-save*). `is_required` baru ditegakkan saat publish (Fitur 4.1).
  - **All-or-Nothing / Transaksi Rollback**: Jika salah satu field dalam batch tidak valid, seluruh batch dibatalkan dan tidak ada perubahan yang disimpan ke database.
- **Respons Sukses `200 OK`**:
```json
{
  "success": true,
  "message": "Invitation content updated successfully",
  "data": {
    "updated_at": "2026-11-02T11:35:00Z",
    "fields_updated": 3
  }
}
```
- **Status Code**:
| Status Code | Penyebab |
|---|---|
| `200 OK` | Konten berhasil disimpan/diperbarui. |
| `400 Bad Request` | Body JSON tidak valid, `fields` kosong atau > 200, duplikasi `field_id`, field bukan milik template, field/section tidak editable, panjang > 5000 karakter, atau melanggar `validation_rules`. |
| `401 Unauthorized` | Pengguna belum login atau token tidak valid. |
| `403 Forbidden` | Role pengguna bukan `partner`. |
| `404 Not Found` | Undangan tidak ditemukan atau milik partner lain. |
| `409 Conflict` | Undangan bukan berstatus `'draft'` (`errors.status = "invitation_is_not_draft"`), atau tidak ditemukan versi draft. |
| `500 Internal Server Error` | Terjadi kesalahan database internal. |
- **Catatan Perilaku**:
  - Hanya operasi tulis pada undangan berstatus `'draft'` yang diizinkan (undangan non-draft dibalas `409 Conflict`).
  - Menggunakan locking transaksi `SELECT ... FOR UPDATE` pada tabel `invitations` dan `invitation_versions` untuk mencegah *race condition*.
  - Menggunakan query `INSERT ... ON CONFLICT (invitation_version_id, template_field_id) DO UPDATE` sehingga operasi bersifat idempoten.
  - Memperbarui kolom `updated_at` pada `invitations` dan `invitation_versions`.

---

#### 5.4.7 Catatan Perubahan terhadap Draft Kontrak Awal

Bagian ini mendokumentasikan penyesuaian antara rancangan awal kontrak dan implementasi riil pada modul undangan:
1. **Model Relasi Event Terintegrasi (1 Undangan = 1 Event)**: Sesuai PRD v3.0, satu undangan digital mengelola satu acara utama. Data event dikirim langsung pada body `POST /invitations` dan diperbarui melalui `PATCH /invitations/:id`. Endpoint terpisah `GET /invitations/:id/events` dan `POST /invitations/:id/events` pada draft awal **dihapus dari kontrak**.
2. **Metode Penyimpanan Konten (PATCH)**: Penyimpanan nilai konten template menggunakan `PATCH /api/v1/invitations/:id/content` (bukan `PUT`) untuk merefleksikan semantik *partial upsert* (memperbarui atau menghapus field yang dikirimkan tanpa mereset field lain yang sudah ada).
3. **Penanda Spesifik Error Kuota/Paket pada 403**: Ketika partner gagal membuat undangan karena ketiadaan paket aktif atau kuota habis, respons 403 menyertakan penanda terstruktur `errors: {"package": "no_active_package"}` atau `errors: {"package": "quota_exhausted"}`.
4. **Status Endpoint Belum Diimplementasikan**: Endpoint `GET /invitations/:id/versions` dan `POST /invitations/:id/publish` diberi tanda eksplisit *"Belum diimplementasikan"* karena implementasinya dijadwalkan pada potongan fitur berikutnya (Fitur 4.1).

---

## 6. Database dan Migration

- Migration dikelola dan ditinjau oleh koordinator backend.
- Migration yang sudah diterapkan tidak boleh diedit.
- Perubahan schema harus menggunakan migration baru yang bergerak maju.
- Setiap permintaan perubahan schema harus menjelaskan kebutuhan, tabel/kolom terdampak, relasi, dan dampaknya terhadap endpoint.
- Developer yang membutuhkan perubahan schema harus mengajukannya sebelum mengimplementasikan ketergantungan terhadap perubahan tersebut.

## 7. Git dan Pull Request

- `main`: versi stabil.
- `develop`: branch integrasi.
- `feature/<nama-fitur>`: branch untuk pekerjaan fitur.
- Jangan mengerjakan fitur langsung di `main` atau `develop`.
- Pull Request fitur diarahkan ke `develop`.
- Pull Request harus menjelaskan tujuan perubahan, cara pengujian, migration terkait, dan potensi dampak lintas modul.
- Perubahan kontrak API dan schema harus dikomunikasikan kepada developer yang terdampak.

## 8. Definition of Done

Sebuah fitur dianggap selesai apabila:

1. Memenuhi kebutuhan fitur yang disepakati.
2. Validasi input diterapkan.
3. Autentikasi, otorisasi, dan pemeriksaan kepemilikan resource sesuai kebutuhan.
4. Query database aman dan menggunakan parameter.
5. Error ditangani menggunakan format yang konsisten.
6. Pengujian yang relevan telah dijalankan.
7. Dokumentasi diperbarui jika kontrak berubah.
8. Tidak ada secret, password, atau data sensitif yang tidak semestinya terekspos.
9. Pull Request sudah ditinjau dan disetujui sebelum merge.

## 9. Status Persetujuan

Dokumen ini adalah draft acuan bersama. Developer A dan Developer B harus meninjau pembagian endpoint, format response, autentikasi, dan aturan integrasi sebelum kontrak dianggap final.

## 10. Modul RSVP

### 10.1. Submit Public RSVP

- **Method**: `POST`
- **Path**: `/api/v1/public/invitations/:slug/rsvp`
- **Autentikasi**: Publik (tanpa token autentikasi)
- **Ukuran Body**: Maksimum 64 KB (dibatasi via `http.MaxBytesReader`)

#### Request Body

| Field | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `name` | string | Ya | Nama tamu, di-trim, 1–255 karakter |
| `attendance_status` | string | Ya | Status kehadiran: `"attending"` atau `"not_attending"` |
| `number_of_guests` | integer | Ya | Jika `attending`: wajib 1–10. Jika `not_attending`: wajib 0 |
| `message` | string | Tidak | Ucapan/pesan tamu, di-trim, maksimum 1000 karakter |

#### Response 201 Created

```json
{
  "success": true,
  "message": "RSVP submitted successfully",
  "data": {
    "attendance_status": "attending",
    "number_of_guests": 2,
    "message": "Selamat berbahagia!",
    "submitted_at": "2026-11-04T15:30:00Z"
  }
}
```

#### Response Error

- **400 Bad Request** (Validasi input / body gagal):
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errors": {
      "attendance_status": "attendance_status must be either 'attending' or 'not_attending'"
    }
  }
  ```
- **404 Not Found** (Slug tidak ditemukan, undangan berstatus draft, atau undangan expired):
  ```json
  {
    "success": false,
    "message": "Invitation not found"
  }
  ```

#### Catatan Keamanan & Arsitektur
- Validasi body dijalankan sebelum query database.
- Respons 404 seragam untuk slug tidak ditemukan, draft, atau expired (anti-enumerasi).
- Setiap pengiriman form membuat satu record tamu baru (`guests`) dengan `unique_token` acak (32 byte hex via `crypto/rand`) dan satu record `rsvps` dalam satu transaksi database atomik.
- Token tidak pernah dikembalikan ke client maupun dicatat ke log aplikasi.
- Backend menyimpan `name` dan `message` apa adanya tanpa HTML sanitization; escaping saat render adalah tanggung jawab frontend.
- Endpoint publik belum memiliki rate limiting dan rawan spam (setiap submit membuat baris tamu); koordinasi dibutuhkan dengan koordinator backend (Catur).

---

### 10.2. Get Invitation RSVPs (Dashboard Partner)

- **Method**: `GET`
- **Path**: `/api/v1/invitations/:id/rsvps`
- **Autentikasi**: Bearer Token (`AuthRequired` + `RequireRole("partner")`)
- **Otorisasi**: Hanya partner pemilik undangan (`WHERE id = $1 AND user_id = $2`)

#### Query Parameters

| Parameter | Tipe | Default | Keterangan |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Nomor halaman (minimal 1) |
| `limit` | integer | `12` | Jumlah per halaman (maksimum 50; nilai > 50 dipotong ke 50) |
| `status` | string | - | Filter kehadiran: `"attending"` atau `"not_attending"` |
| `search` | string | - | Pencarian nama tamu (case-insensitive ILIKE, maksimum 100 karakter) |

#### Response 200 OK

```json
{
  "success": true,
  "message": "RSVP list retrieved successfully",
  "data": {
    "summary": {
      "total_responses": 3,
      "attending_count": 2,
      "not_attending_count": 1,
      "total_guests": 5
    },
    "rsvps": [
      {
        "id": 142,
        "name": "Budi Santoso",
        "attendance_status": "attending",
        "number_of_guests": 2,
        "message": "Selamat berbahagia!",
        "submitted_at": "2026-11-04T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

#### Response Error

- **400 Bad Request**: ID undangan tidak valid, filter `status` tidak valid, atau `search` > 100 karakter.
- **401 Unauthorized**: Tidak menyertakan token otentikasi atau token tidak valid.
- **403 Forbidden**: Pengguna terautentikasi tetapi memiliki role selain `partner`.
- **404 Not Found**: Undangan tidak ditemukan atau bukan milik partner yang sedang login.

#### Catatan Keamanan & Arsitektur
- `summary` dihitung atas seluruh RSVP undangan dan tidak terpengaruh oleh filter `status` maupun `search`.
- `total_guests` merupakan penjumlahan `SUM(number_of_guests)` khusus untuk tamu dengan status `"attending"`.
- Response tidak mengekspos `unique_token`, `phone`, `email`, `category`, atau `invitation_id`.

---

### 10.3. Delete Invitation RSVP

- **Method**: `DELETE`
- **Path**: `/api/v1/invitations/:id/rsvps/:rsvp_id`
- **Autentikasi**: Bearer Token (`AuthRequired` + `RequireRole("partner")`)
- **Otorisasi**: Hanya partner pemilik undangan (`WHERE i.id = $id AND i.user_id = $userID`)

#### Path Parameters

| Parameter | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | integer | ID undangan (wajib, integer positif) |
| `rsvp_id` | integer | ID RSVP yang akan dihapus (wajib, integer positif) |

#### Response 200 OK

```json
{
  "success": true,
  "message": "RSVP deleted successfully"
}
```

#### Response Error

- **401 Unauthorized**: Tidak menyertakan token otentikasi atau token tidak valid (middleware).
- **403 Forbidden**: Pengguna terautentikasi tetapi memiliki role selain `partner` (middleware).
- **400 Bad Request**: `:id` atau `:rsvp_id` tidak valid (bukan angka positif atau melebihi kapasitas int64).
  ```json
  {
    "success": false,
    "message": "Invalid RSVP ID",
    "errors": {
      "rsvp_id": "rsvp id must be a positive integer"
    }
  }
  ```
- **404 Not Found**: Undangan atau RSVP tidak ditemukan, atau bukan milik partner yang sedang login.
  ```json
  {
    "success": false,
    "message": "RSVP not found"
  }
  ```

#### Catatan Keamanan & Arsitektur
- Urutan evaluasi: middleware otentikasi (401) dan role (403) dijalankan terlebih dahulu, dilanjutkan dengan validasi parameter ID di handler (400), lalu verifikasi keberadaan serta kepemilikan di SQL (404).
- Menghapus RSVP dilakukan dengan menghapus baris tamu terkait (`guests`), sehingga baris `rsvps` ikut terhapus otomatis melalui `ON DELETE CASCADE` untuk mencegah baris tamu yatim (orphaned guest).
- Baris `guest_media` milik tamu ikut terhapus (`CASCADE`), sedangkan pesan pada `guestbook_messages` milik tamu tetap ada dengan kolom `guest_id` disetel `NULL` (`SET NULL`).
- Operasi ini bersifat permanen (*hard delete*) dan tidak dapat dibatalkan (*cannot be undone*).
- Berlaku untuk undangan dengan status apa pun (`draft`, `published`, `expired`) selama dimiliki oleh partner yang bersangkutan.
- Anti-enumerasi: Jika `:rsvp_id` tidak ditemukan, milik undangan lain, atau milik partner lain, backend memberikan respons seragam 404 tanpa membocorkan eksistensi data.
