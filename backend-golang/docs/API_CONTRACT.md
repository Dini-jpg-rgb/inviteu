# InviteU — API Contract

**Status:** Draft — perlu disepakati oleh tim backend  
**Base URL:** `/api/v1`  
**Backend:** Go, Gin, PostgreSQL

## 1. Tujuan

Dokumen ini menjadi acuan bersama bagi Developer A dan Developer B dalam membangun API InviteU agar format endpoint, response, autentikasi, otorisasi, dan penanganan error tetap konsisten.

Perubahan kontrak harus dikomunikasikan sebelum implementasi yang terdampak dilakukan.

## 2. Aturan Umum

- Semua endpoint API baru menggunakan prefix `/api/v1`.
- Request dan response menggunakan JSON kecuali endpoint upload file atau kebutuhan khusus lainnya.
- Nama properti JSON menggunakan `snake_case`.
- Waktu menggunakan format ISO 8601 dengan timezone yang jelas.
- Gunakan HTTP status code sesuai hasil operasi.
- Endpoint privat wajib memeriksa autentikasi.
- Hak akses wajib diperiksa di backend, bukan hanya di frontend.
- Query database harus menggunakan parameter, bukan menggabungkan input pengguna langsung ke SQL.
- Password, token rahasia, dan kredensial tidak boleh ditulis ke log.

## 3. Format Response

### 3.1 Response Sukses

Contoh response `200 OK`:

    {
      "success": true,
      "message": "Data retrieved successfully",
      "data": {
        "id": 1,
        "name": "Example"
      }
    }

`data` menyesuaikan hasil endpoint. Untuk endpoint daftar, `data` dapat berupa array.

### 3.2 Response Error

Contoh response validasi `422 Unprocessable Content`:

    {
      "success": false,
      "message": "Validation failed",
      "errors": {
        "email": "Email format is invalid"
      }
    }

Untuk error yang tidak berkaitan dengan validasi, properti `errors` boleh tidak disertakan.

### 3.3 HTTP Status Code

- `200 OK`: operasi berhasil.
- `201 Created`: resource berhasil dibuat.
- `204 No Content`: operasi berhasil tanpa response body.
- `400 Bad Request`: request tidak valid atau tidak dapat diproses.
- `401 Unauthorized`: pengguna belum terautentikasi atau kredensial tidak valid.
- `403 Forbidden`: pengguna tidak memiliki izin.
- `404 Not Found`: resource tidak ditemukan atau tidak dapat diakses oleh pengguna tersebut.
- `409 Conflict`: konflik dengan kondisi resource yang ada.
- `422 Unprocessable Content`: format request dapat dibaca, tetapi validasi bisnis gagal.
- `429 Too Many Requests`: batas request terlampaui.
- `500 Internal Server Error`: kesalahan internal yang tidak terduga.

Semua error harus menggunakan format JSON yang konsisten, kecuali endpoint yang memang memiliki kebutuhan khusus.

## 4. Autentikasi dan Otorisasi

Role utama InviteU:

- `partner`: mengelola akun partner, paket yang dimiliki, pesanan, dan undangan miliknya.
- `designer`: mengelola tugas desain dan revisi yang ditugaskan kepadanya.
- `admin`: mengakses fungsi administrasi sesuai kewenangannya.

Endpoint publik tidak memerlukan autentikasi. Endpoint privat wajib memeriksa identitas pengguna dan kepemilikan resource.

Role dan kepemilikan resource harus diverifikasi di server. Mengetahui ID resource tidak otomatis memberikan hak untuk mengaksesnya.

Metode autentikasi, masa berlaku token, refresh token, dan mekanisme logout harus ditetapkan sebelum implementasi autentikasi dimulai.

## 5. Rancangan Endpoint

Daftar berikut merupakan rancangan awal, bukan endpoint yang sudah diimplementasikan.

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

### 5.3 Katalog Template — Developer B

| Method | Endpoint                                  | Akses                         |
| ------ | ----------------------------------------- | ----------------------------- |
| GET    | `/api/v1/templates`                       | Publik                        |
| GET    | `/api/v1/templates/categories`            | Publik                        |
| GET    | `/api/v1/templates/:id`                   | Publik jika template tersedia |
| GET    | `/api/v1/users/me/favorites`              | Pengguna terautentikasi       |
| POST   | `/api/v1/users/me/favorites`              | Pengguna terautentikasi       |
| DELETE | `/api/v1/users/me/favorites/:template_id` | Pengguna terautentikasi       |

Parameter pencarian, kategori, filter, sort, dan pagination akan didokumentasikan sesuai kemampuan katalog yang disepakati.

### 5.4 Undangan dan Builder — Developer B

| Method | Endpoint                           | Akses                                    |
| ------ | ---------------------------------- | ---------------------------------------- |
| POST   | `/api/v1/invitations`              | Partner dengan hak penggunaan yang valid |
| GET    | `/api/v1/invitations`              | Partner, hanya undangan miliknya         |
| GET    | `/api/v1/invitations/:id`          | Pemilik undangan atau admin sesuai izin  |
| PATCH  | `/api/v1/invitations/:id`          | Pemilik undangan dengan izin yang valid  |
| GET    | `/api/v1/invitations/:id/versions` | Pemilik undangan atau admin sesuai izin  |
| POST   | `/api/v1/invitations/:id/publish`  | Pemilik undangan dengan izin yang valid  |
| GET    | `/api/v1/invitations/:id/events`   | Pemilik undangan atau admin sesuai izin  |
| POST   | `/api/v1/invitations/:id/events`   | Pemilik undangan dengan izin yang valid  |

Satu undangan dapat memiliki beberapa event. Perubahan pada undangan yang sudah dipublikasikan harus mengikuti mekanisme versioning: versi publik yang sedang aktif tetap tampil sampai versi baru berhasil dipublikasikan.

Endpoint tamu, RSVP, guestbook, hadiah, domain, dan media akan ditambahkan dalam kontrak lanjutan.

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

Dokumen ini adalah draft. Developer A dan Developer B harus meninjau pembagian endpoint, format response, autentikasi, dan aturan integrasi sebelum kontrak dianggap final.
