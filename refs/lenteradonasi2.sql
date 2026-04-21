-- -------------------------------------------------------------
-- TablePlus 6.8.6(662)
--
-- https://tableplus.com/
--
-- Database: neondb
-- Generation Time: 2026-04-19 10:38:58.9230
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."ngo_configs" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS ngo_configs_id_seq;

-- Table Definition
CREATE TABLE "public"."ngo_configs" (
    "id" int8 NOT NULL DEFAULT nextval('ngo_configs_id_seq'::regclass),
    "ngo_name" varchar(150) NOT NULL,
    "logo_url" varchar(255),
    "short_description" text,
    "address" text,
    "legal_info" text,
    "primary_color" varchar(20) DEFAULT '#1086b1'::character varying,
    "whatsapp_number" varchar(20),
    "instagram_url" varchar(255),
    "facebook_url" varchar(255),
    "meta_pixel_id" varchar(50),
    "meta_capi_token" text,
    "google_ads_id" varchar(50),
    "google_developer_token" varchar(255),
    "tiktok_pixel_id" varchar(50),
    "tiktok_events_api_token" text,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."admins" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS admins_id_seq;

-- Table Definition
CREATE TABLE "public"."admins" (
    "id" int8 NOT NULL DEFAULT nextval('admins_id_seq'::regclass),
    "name" varchar(100) NOT NULL,
    "email" varchar(150) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "role" varchar(50) DEFAULT 'SUPERADMIN'::character varying,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."categories" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS categories_id_seq;

-- Table Definition
CREATE TABLE "public"."categories" (
    "id" int8 NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
    "name" varchar(100) NOT NULL,
    "color_theme" varchar(50),
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."campaigns" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS campaigns_id_seq;

-- Table Definition
CREATE TABLE "public"."campaigns" (
    "id" int8 NOT NULL DEFAULT nextval('campaigns_id_seq'::regclass),
    "category_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "slug" varchar(255) NOT NULL,
    "image_url" varchar(255),
    "description" text,
    "is_verified" bool DEFAULT true,
    "is_urgent" bool DEFAULT false,
    "minimum_amount" int8 DEFAULT 10000,
    "suggestion_amounts" _int8 DEFAULT ARRAY[10000, 25000, 50000, 100000, 200000, 500000],
    "is_zakat" bool DEFAULT false,
    "is_qurban" bool DEFAULT false,
    "is_fixed_amount" bool DEFAULT false,
    "is_bundle" bool DEFAULT false,
    "has_no_target" bool DEFAULT false,
    "has_no_time_limit" bool DEFAULT false,
    "sort" int4 DEFAULT 0,
    "target_amount" int8,
    "end_date" timestamptz,
    "base_commission_pct" numeric(5,2) DEFAULT 0.00,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."campaign_qris_static" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS campaign_qris_static_id_seq;

-- Table Definition
CREATE TABLE "public"."campaign_qris_static" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_qris_static_id_seq'::regclass),
    "campaign_id" int8 NOT NULL,
    "external_id" varchar(100) NOT NULL,
    "qris_string" text NOT NULL,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."campaign_bundles" CASCADE;
-- Table Definition
CREATE TABLE "public"."campaign_bundles" (
    "bundle_campaign_id" int8 NOT NULL,
    "item_campaign_id" int8 NOT NULL,
    "qty" int2 DEFAULT 1,
    PRIMARY KEY ("bundle_campaign_id","item_campaign_id")
);

DROP TABLE IF EXISTS "public"."campaign_variants" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS campaign_variants_id_seq;

-- Table Definition
CREATE TABLE "public"."campaign_variants" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_variants_id_seq'::regclass),
    "campaign_id" int8 NOT NULL,
    "name" varchar(150) NOT NULL,
    "price" int8 NOT NULL,
    "names_per_qty" int2 DEFAULT 1,
    "stock_limit" int4,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."campaign_stats" CASCADE;
-- Table Definition
CREATE TABLE "public"."campaign_stats" (
    "campaign_id" int8 NOT NULL,
    "collected_amount" int8 DEFAULT 0,
    "donor_count" int4 DEFAULT 0,
    "package_sold" int4 DEFAULT 0,
    "views_count" int8 DEFAULT 0,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("campaign_id")
);

DROP TABLE IF EXISTS "public"."campaign_updates" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS campaign_updates_id_seq;

-- Table Definition
CREATE TABLE "public"."campaign_updates" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_updates_id_seq'::regclass),
    "campaign_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "excerpt" text,
    "content" text,
    "image_url" varchar(255),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."affiliates" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS affiliates_id_seq;

-- Table Definition
CREATE TABLE "public"."affiliates" (
    "id" int8 NOT NULL DEFAULT nextval('affiliates_id_seq'::regclass),
    "affiliate_code" varchar(20) NOT NULL,
    "name" varchar(100) NOT NULL,
    "email" varchar(150) NOT NULL,
    "phone" varchar(20),
    "password_hash" varchar(255) NOT NULL,
    "balance" int8 DEFAULT 0,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."affiliate_commissions" CASCADE;
-- Table Definition
CREATE TABLE "public"."affiliate_commissions" (
    "affiliate_id" int8 NOT NULL,
    "campaign_id" int8 NOT NULL,
    "commission_type" varchar(20) DEFAULT 'PERCENTAGE'::character varying,
    "commission_value" numeric(10,2) NOT NULL,
    PRIMARY KEY ("affiliate_id","campaign_id")
);

DROP TABLE IF EXISTS "public"."affiliate_campaign_stats" CASCADE;
-- Table Definition
CREATE TABLE "public"."affiliate_campaign_stats" (
    "affiliate_id" int8 NOT NULL,
    "campaign_id" int8 NOT NULL,
    "click_count" int4 DEFAULT 0,
    "converted_donors" int4 DEFAULT 0,
    "raised_amount" int8 DEFAULT 0,
    "commission_earned" int8 DEFAULT 0,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("affiliate_id","campaign_id")
);

DROP TABLE IF EXISTS "public"."withdrawals" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS withdrawals_id_seq;

-- Table Definition
CREATE TABLE "public"."withdrawals" (
    "id" int8 NOT NULL DEFAULT nextval('withdrawals_id_seq'::regclass),
    "affiliate_id" int8 NOT NULL,
    "amount" int8 NOT NULL,
    "bank_account_info" varchar(255) NOT NULL,
    "status" varchar(20) DEFAULT 'PENDING'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamptz,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_methods" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_methods_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_methods" (
    "id" int8 NOT NULL DEFAULT nextval('payment_methods_id_seq'::regclass),
    "code" varchar(50) NOT NULL,
    "name" varchar(100) NOT NULL,
    "logo_url" varchar(255),
    "type" varchar(50) NOT NULL,
    "provider" varchar(50) NOT NULL,
    "admin_fee_flat" int8 DEFAULT 0,
    "admin_fee_pct" numeric(5,2) DEFAULT 0.00,
    "is_active" bool DEFAULT true,
    "is_redirect" bool DEFAULT false,
    "sort_order" int4 DEFAULT 0,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_instructions" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_instructions" (
    "id" int8 NOT NULL DEFAULT nextval('payment_instructions_id_seq'::regclass),
    "payment_method_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "content" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."donors" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS donors_id_seq;

-- Table Definition
CREATE TABLE "public"."donors" (
    "id" int8 NOT NULL DEFAULT nextval('donors_id_seq'::regclass),
    "name" varchar(150) NOT NULL,
    "email" varchar(150),
    "phone" varchar(20),
    "is_anonymous_default" bool DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."invoices" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS invoices_id_seq;

-- Table Definition
CREATE TABLE "public"."invoices" (
    "id" int8 NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "donor_id" int8,
    "payment_method_id" int8 NOT NULL,
    "donor_name_snapshot" varchar(150) NOT NULL,
    "donor_email" varchar(150),
    "donor_phone" varchar(20),
    "is_anonymous" bool DEFAULT false,
    "base_amount" int8 NOT NULL,
    "admin_fee" int8 DEFAULT 0,
    "total_amount" int8 NOT NULL,
    "fb_click_id" varchar(255),
    "fb_browser_id" varchar(255),
    "tiktok_click_id" varchar(255),
    "google_click_id" varchar(255),
    "client_ip_address" varchar(45),
    "client_user_agent" text,
    "status" varchar(20) DEFAULT 'PENDING'::character varying,
    "va_number" varchar(50),
    "payment_url" text,
    "qris_dynamic" text,
    "proof_transfer" text,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" timestamptz,
    PRIMARY KEY ("id","created_at")
);

DROP TABLE IF EXISTS "public"."invoices_y2026m10" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS invoices_id_seq;

-- Table Definition
CREATE TABLE "public"."invoices_y2026m10" (
    "id" int8 NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "donor_id" int8,
    "payment_method_id" int8 NOT NULL,
    "donor_name_snapshot" varchar(150) NOT NULL,
    "donor_email" varchar(150),
    "donor_phone" varchar(20),
    "is_anonymous" bool DEFAULT false,
    "base_amount" int8 NOT NULL,
    "admin_fee" int8 DEFAULT 0,
    "total_amount" int8 NOT NULL,
    "fb_click_id" varchar(255),
    "fb_browser_id" varchar(255),
    "tiktok_click_id" varchar(255),
    "google_click_id" varchar(255),
    "client_ip_address" varchar(45),
    "client_user_agent" text,
    "status" varchar(20) DEFAULT 'PENDING'::character varying,
    "va_number" varchar(50),
    "payment_url" text,
    "qris_dynamic" text,
    "proof_transfer" text,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" timestamptz,
    PRIMARY KEY ("id","created_at")
);

DROP TABLE IF EXISTS "public"."transactions" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS transactions_id_seq;

-- Table Definition
CREATE TABLE "public"."transactions" (
    "id" int8 NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
    "invoice_id" int8 NOT NULL,
    "invoice_created_at" timestamptz NOT NULL,
    "campaign_id" int8 NOT NULL,
    "bundle_campaign_id" int8,
    "variant_id" int8,
    "affiliate_id" int8,
    "qty" int2 DEFAULT 1,
    "amount" int8 NOT NULL,
    "affiliate_commission" int8 DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id","created_at")
);

DROP TABLE IF EXISTS "public"."transactions_y2026m10" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS transactions_id_seq;

-- Table Definition
CREATE TABLE "public"."transactions_y2026m10" (
    "id" int8 NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
    "invoice_id" int8 NOT NULL,
    "invoice_created_at" timestamptz NOT NULL,
    "campaign_id" int8 NOT NULL,
    "bundle_campaign_id" int8,
    "variant_id" int8,
    "affiliate_id" int8,
    "qty" int2 DEFAULT 1,
    "amount" int8 NOT NULL,
    "affiliate_commission" int8 DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id","created_at")
);

DROP TABLE IF EXISTS "public"."transaction_qurban_names" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS transaction_qurban_names_id_seq;

-- Table Definition
CREATE TABLE "public"."transaction_qurban_names" (
    "id" int8 NOT NULL DEFAULT nextval('transaction_qurban_names_id_seq'::regclass),
    "transaction_id" int8 NOT NULL,
    "transaction_created_at" timestamptz NOT NULL,
    "mudhohi_name" varchar(150) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."payment_logs" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."payment_logs" (
    "id" int8 NOT NULL DEFAULT nextval('payment_logs_id_seq'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "endpoint" varchar(255),
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."notification_templates" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_templates" (
    "id" int8 NOT NULL DEFAULT nextval('notification_templates_id_seq'::regclass),
    "event_trigger" varchar(50) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "message_content" text NOT NULL,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."notification_logs" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."notification_logs" (
    "id" int8 NOT NULL DEFAULT nextval('notification_logs_id_seq'::regclass),
    "template_id" int8,
    "invoice_code" varchar(50),
    "recipient" varchar(150) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."ads_conversion_logs" CASCADE;
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS ads_conversion_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."ads_conversion_logs" (
    "id" int8 NOT NULL DEFAULT nextval('ads_conversion_logs_id_seq'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "platform" varchar(50) NOT NULL,
    "event_name" varchar(100) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

INSERT INTO "public"."ngo_configs" ("id", "ngo_name", "logo_url", "short_description", "address", "legal_info", "primary_color", "whatsapp_number", "instagram_url", "facebook_url", "meta_pixel_id", "meta_capi_token", "google_ads_id", "google_developer_token", "tiktok_pixel_id", "tiktok_events_api_token", "updated_at") VALUES
(1, 'Yayasan Peduli Sesama', NULL, 'Lembaga filantropi independen yang berdedikasi untuk menyalurkan kebaikan donatur secara transparan, profesional, dan tepat sasaran.', 'Jl. Kebaikan Bangsa No. 99, Gedung Amal Lt. 2, Jakarta Selatan, DKI Jakarta 12345', 'Resmi terdaftar dengan SK Kemenkumham RI No. AHU-00123.AH.01.04.Tahun 2026', '#1086b1', '6281234567890', NULL, NULL, '123456789012345', NULL, NULL, NULL, 'CD12345TIKTOKPIXEL', NULL, '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."admins" ("id", "name", "email", "password_hash", "role", "status", "created_at") VALUES
(1, 'Ahmad Fulan', 'ahmad@ngo.org', '$2a$12$Dummy', 'SUPERADMIN', 'ACTIVE', '2026-04-19 01:39:51.048594+00'),
(2, 'Rina Keuangan', 'rina@ngo.org', '$2a$12$Dummy', 'FINANCE', 'ACTIVE', '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."categories" ("id", "name", "color_theme", "is_active") VALUES
(1, 'Medis', 'rose', 't'),
(2, 'Pendidikan', 'blue', 't'),
(3, 'Bencana', 'orange', 't'),
(4, 'Panti Asuhan', 'teal', 't'),
(5, 'Zakat', 'emerald', 't'),
(6, 'Qurban', 'amber', 't'),
(7, 'Infaq', 'indigo', 't'),
(8, 'Pembangunan', 'slate', 't');

INSERT INTO "public"."campaigns" ("id", "category_id", "title", "slug", "image_url", "description", "is_verified", "is_urgent", "minimum_amount", "suggestion_amounts", "is_zakat", "is_qurban", "is_fixed_amount", "is_bundle", "has_no_target", "has_no_time_limit", "sort", "target_amount", "end_date", "base_commission_pct", "status", "created_at", "updated_at") VALUES
(1, 1, 'Bantu Adik Rina Sembuh dari Gagal Ginjal', 'bantu-adik-rina', 'https://images.pexels.com/photos/3845125/pexels-photo-3845125.jpeg', 'Adik Rina (8 tahun) saat ini sedang berjuang...', 't', 't', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 'f', 'f', 'f', 'f', 0, 150000000, '2026-10-24 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(2, 2, 'Pembangunan Sekolah Darurat di Pelosok NTT', 'sekolah-ntt', 'https://images.pexels.com/photos/8613322/pexels-photo-8613322.jpeg', 'Ratusan anak di desa terpencil NTT...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 'f', 'f', 'f', 'f', 0, 300000000, '2026-11-26 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(3, 3, 'Bantuan Pangan Korban Banjir Bandang', 'banjir-bandang', 'https://images.pexels.com/photos/6994992/pexels-photo-6994992.jpeg', 'Banjir bandang telah menyapu bersih...', 't', 't', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 'f', 'f', 'f', 'f', 0, 50000000, '2026-10-15 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(4, 4, 'Sedekah Paket Berbuka Puasa untuk Pejuang Jalanan', 'paket-berbuka', 'https://images.pexels.com/photos/6995201/pexels-photo-6995201.jpeg', 'Banyak saudara kita yang berpuasa...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 't', 'f', 'f', 'f', 0, 70000000, '2026-11-01 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(5, 5, 'Tunaikan Zakat Profesi & Maal Anda', 'zakat', 'https://images.pexels.com/photos/4968636/pexels-photo-4968636.jpeg', 'Sucikan harta Anda dengan menunaikan zakat.', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 't', 'f', 'f', 'f', 'f', 'f', 0, 500000000, '2027-10-12 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(6, 6, 'Qurban Pedalaman: Kambing Standar', 'qurban-kambing', 'https://images.pexels.com/photos/5698305/pexels-photo-5698305.jpeg', 'Qurban kambing (berat 23-25 kg)...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 't', 't', 'f', 'f', 'f', 0, 200000000, '2026-11-26 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(7, 6, 'Qurban Pedalaman: Patungan 1/7 Sapi', 'patungan-sapi', 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg', 'Ikut patungan 1/7 bagian sapi qurban.', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 't', 't', 'f', 'f', 'f', 0, 315000000, '2026-11-26 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(8, 6, 'Qurban Pedalaman: 1 Ekor Sapi Utuh', 'qurban-sapi', 'https://images.pexels.com/photos/16399151/pexels-photo-16399151.jpeg', 'Tunaikan qurban 1 ekor sapi utuh...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 't', 't', 'f', 'f', 'f', 0, 420000000, '2026-11-26 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(9, 7, 'Infaq Operasional & Pengembangan Dakwah', 'infaq', 'https://images.pexels.com/photos/1310102/pexels-photo-1310102.jpeg', 'Salurkan infaq terbaik Anda untuk mendukung...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 'f', 'f', 't', 't', 0, NULL, NULL, 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(10, 4, 'Paket Basmalah (5 Buka Puasa + 8 Kado Yatim)', 'paket-basmalah', 'https://images.pexels.com/photos/9127752/pexels-photo-9127752.jpeg', 'Maksimalkan pahala Anda dengan program Bundling...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 't', 't', 'f', 'f', 0, 500000000, '2026-11-06 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(11, 8, 'Pembangunan Masjid Al-Ikhlas', 'masjid-alikhlas', 'https://images.pexels.com/photos/1310102/pexels-photo-1310102.jpeg', 'Pembangunan Masjid...', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 'f', 'f', 'f', 'f', 0, 1000000000, '2027-10-12 23:59:59+00', 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00'),
(12, 4, 'Kado Lebaran Yatim', 'kado-yatim', '', 'Hidden campaign for bundle item', 't', 'f', 10000, '{10000,25000,50000,100000,200000,500000}', 'f', 'f', 't', 'f', 'f', 'f', 0, NULL, NULL, 0.00, 'ACTIVE', '2026-04-19 01:39:51.048594+00', '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."campaign_qris_static" ("id", "campaign_id", "external_id", "qris_string", "status", "created_at") VALUES
(1, 9, 'QRIS-INFAQ-STATIC-001', '00020101021226660014ID.CO.QRIS.WWW01189360091530000020215ID102002131920315ID102002131925204481053033605802ID5902ID6015BANDUNG SELATAN61054023262070703A0163046C49', 'ACTIVE', '2026-04-19 01:39:51.048594+00'),
(2, 11, 'QRIS-MASJID-STATIC-002', '00020101021226660014ID.CO.QRIS.WWW01189360091530000020215ID102002131920315ID102002131925204481053033605802ID5902ID6015BANDUNG SELATAN61054023262070703A0163046C49', 'ACTIVE', '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."campaign_bundles" ("bundle_campaign_id", "item_campaign_id", "qty") VALUES
(10, 4, 5),
(10, 12, 8);

INSERT INTO "public"."campaign_variants" ("id", "campaign_id", "name", "price", "names_per_qty", "stock_limit", "is_active") VALUES
(1, 4, 'Paket Berbuka', 35000, 1, NULL, 't'),
(2, 6, 'Ekor Kambing', 2500000, 1, NULL, 't'),
(3, 7, 'Bagian Sapi (1/7)', 3000000, 1, NULL, 't'),
(4, 8, 'Ekor Sapi', 21000000, 7, NULL, 't'),
(5, 10, 'Paket Basmalah', 415000, 1, NULL, 't'),
(6, 12, 'Paket Kado Yatim', 30000, 1, NULL, 't');

INSERT INTO "public"."campaign_stats" ("campaign_id", "collected_amount", "donor_count", "package_sold", "views_count", "updated_at") VALUES
(1, 105000000, 1245, 0, 12400, '2026-04-19 01:39:51.048594+00'),
(2, 85000000, 830, 0, 0, '2026-04-19 01:39:51.048594+00'),
(3, 48000000, 2100, 0, 0, '2026-04-19 01:39:51.048594+00'),
(4, 24500000, 700, 0, 0, '2026-04-19 01:39:51.048594+00'),
(5, 125000000, 340, 0, 8900, '2026-04-19 01:39:51.048594+00'),
(6, 45000000, 18, 0, 0, '2026-04-19 01:39:51.048594+00'),
(7, 126000000, 42, 0, 0, '2026-04-19 01:39:51.048594+00'),
(8, 63000000, 3, 0, 4200, '2026-04-19 01:39:51.048594+00'),
(9, 15450000, 342, 0, 15600, '2026-04-19 01:39:51.048594+00'),
(10, 83000000, 200, 0, 0, '2026-04-19 01:39:51.048594+00'),
(11, 850000000, 1500, 0, 25000, '2026-04-19 01:39:51.048594+00'),
(12, 0, 0, 0, 0, '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."campaign_updates" ("id", "campaign_id", "title", "excerpt", "content", "image_url", "created_at") VALUES
(1, 1, 'Penyaluran Tahap 1: Biaya Cuci Darah', 'Dana sebesar Rp 15.000.000 telah disalurkan untuk biaya cuci darah Dik Rina...', 'Terima kasih Orang Baik!\n\nDana sebesar Rp 15.000.000 telah disalurkan untuk biaya cuci darah Dik Rina selama 1 bulan ke depan. Kondisi Rina saat ini berangsur stabil namun masih membutuhkan perawatan intensif.\n\nDoakan Rina terus ya agar segera pulih sepenuhnya!', 'https://images.pexels.com/photos/2324837/pexels-photo-2324837.jpeg', '2026-10-15 10:00:00+00'),
(2, 2, 'Peletakan Batu Pertama Dimulai!', 'Alhamdulillah, proses pembangunan sekolah darurat mulai berjalan dengan antusiasme warga...', 'Halo Kakak-kakak Baik!\n\nKabar gembira, berkat donasi Anda, peletakan batu pertama untuk sekolah darurat telah dilaksanakan. Warga sangat antusias bergotong royong membersihkan lahan.\n\nTerus dukung kami agar bangunan ini segera berdiri dan anak-anak bisa belajar dengan nyaman.', 'https://images.pexels.com/photos/11844555/pexels-photo-11844555.jpeg', '2026-10-10 10:00:00+00');

INSERT INTO "public"."affiliates" ("id", "affiliate_code", "name", "email", "phone", "password_hash", "balance", "status", "created_at") VALUES
(1, 'AFF-992', 'Budi Marketer', 'budi.marketer@email.com', '08123456789', '$2a$12$Dummy', 1250000, 'ACTIVE', '2026-04-19 01:39:51.048594+00'),
(2, 'KOHDENIS', 'koh denis', 'irvan@cnt.id', '081462206437', '$2a$12$DummyGeneratedByAdmin', 0, 'ACTIVE', '2026-04-19 02:49:12.748093+00');

INSERT INTO "public"."affiliate_commissions" ("affiliate_id", "campaign_id", "commission_type", "commission_value") VALUES
(1, 1, 'PERCENTAGE', 5.00),
(1, 5, 'PERCENTAGE', 2.00),
(1, 10, 'AMOUNT', 15000.00);

INSERT INTO "public"."affiliate_campaign_stats" ("affiliate_id", "campaign_id", "click_count", "converted_donors", "raised_amount", "commission_earned", "updated_at") VALUES
(1, 1, 12450, 342, 25000000, 1250000, '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."withdrawals" ("id", "affiliate_id", "amount", "bank_account_info", "status", "created_at", "processed_at") VALUES
(1, 1, 500000, 'BCA 123456789 a.n Budi Marketer', 'PROCESSED', '2026-04-19 01:39:51.048594+00', '2026-10-01 10:00:00+00'),
(2, 1, 750000, 'GoPay 08123456789', 'PROCESSED', '2026-04-19 01:39:51.048594+00', '2026-09-15 14:00:00+00');

INSERT INTO "public"."payment_methods" ("id", "code", "name", "logo_url", "type", "provider", "admin_fee_flat", "admin_fee_pct", "is_active", "is_redirect", "sort_order") VALUES
(1, 'GOPAY', 'GoPay', 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg', 'E-Wallet', 'Midtrans', 0, 0.00, 't', 'f', 1),
(2, 'BCAVA', 'BCA Virtual Account', 'https://upload.wikimedia.org/wikipedia/id/e/e0/BCA_logo.svg', 'Bank Transfer', 'Xendit', 4000, 0.00, 't', 'f', 2),
(3, 'MANDIRIVA', 'Mandiri Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_of_Bank_Mandiri.svg', 'Bank Transfer', 'Xendit', 4000, 0.00, 't', 'f', 3),
(4, 'BSIVA', 'BSI Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg', 'Bank Transfer', 'Xendit', 4000, 0.00, 't', 'f', 4),
(5, 'MANUAL_BSI', 'BSI Manual Transfer', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg', 'Manual Transfer', 'Manual', 0, 0.00, 't', 'f', 5);

INSERT INTO "public"."payment_instructions" ("id", "payment_method_id", "title", "content", "sort_order", "created_at") VALUES
(1, 2, 'Pembayaran Pembayaran via m-BCA', '<ol><li>Buka aplikasi BCA Mobile dan login.</li><li>Pilih menu <strong>m-Transfer</strong> > <strong>BCA Virtual Account</strong>.</li><li>Masukkan nomor Virtual Account yang tertera di atas dan klik <strong>Send</strong>.</li></ol>', 1, '2026-04-19 01:39:51.048594+00'),
(2, 2, 'Pembayaran Pembayaran via ATM BCA', '<ol><li>Masukkan kartu ATM dan PIN Anda.</li><li>Pilih menu <strong>Transaksi Lainnya</strong> > <strong>Transfer</strong> > <strong>Ke Rek BCA Virtual Account</strong>.</li></ol>', 2, '2026-04-19 01:39:51.048594+00'),
(3, 1, 'Pembayaran dengan Aplikasi Gojek / GoPay', '<ol><li>Buka aplikasi Gojek atau dompet digital Anda.</li><li>Pilih menu <strong>Bayar / Scan</strong>.</li><li>Scan QR Code yang tampil di layar atau upload dari galeri.</li></ol>', 1, '2026-04-19 01:39:51.048594+00'),
(4, 5, 'Transfer via ATM / M-Banking BSI', '<ol><li>Login ke aplikasi BSI Mobile atau datangi ATM BSI terdekat.</li><li>Pilih menu <strong>Transfer</strong> > <strong>Antar Rekening BSI</strong>.</li><li>Masukkan rekening tujuan: <strong>7123456789</strong>.</li><li>Pastikan nama penerima: <strong>Yayasan Peduli Sesama</strong>.</li><li>Transfer dana sesuai dengan nominal tagihan hingga 3 digit terakhir.</li><li>Simpan bukti transfer dan unggah pada halaman ini.</li></ol>', 1, '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."donors" ("id", "name", "email", "phone", "is_anonymous_default", "created_at") VALUES
(1, 'Andi Dermawan', 'andi@email.com', '08123456789', 'f', '2026-04-19 01:39:51.048594+00'),
(2, 'Budi Santoso', 'budi.s@email.com', '08567890123', 'f', '2026-04-19 01:39:51.048594+00'),
(3, 'Siti Aminah', 'siti@email.com', '08198765432', 'f', '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."invoices" ("id", "invoice_code", "donor_id", "payment_method_id", "donor_name_snapshot", "donor_email", "donor_phone", "is_anonymous", "base_amount", "admin_fee", "total_amount", "fb_click_id", "fb_browser_id", "tiktok_click_id", "google_click_id", "client_ip_address", "client_user_agent", "status", "va_number", "payment_url", "qris_dynamic", "created_at", "paid_at") VALUES
(1, 'TRX-9921', 1, 1, 'Andi Dermawan', NULL, NULL, 'f', 100000, 0, 100000, 'fb.1.123abc456', NULL, NULL, NULL, '192.168.1.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)', 'PAID', NULL, NULL, NULL, '2026-10-12 14:30:00+00', '2026-10-12 14:32:00+00'),
(2, 'TRX-9922', NULL, 2, 'Hamba Allah', NULL, NULL, 't', 500000, 4000, 504000, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL, '2026-10-12 15:10:00+00', NULL),
(3, 'TRX-9923', 2, 3, 'Budi Santoso', NULL, NULL, 'f', 21000000, 4000, 21004000, NULL, NULL, 'tiktok.abc.123', NULL, '114.120.10.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'PAID', NULL, NULL, NULL, '2026-10-12 16:05:00+00', '2026-10-12 16:15:00+00'),
(4, 'TRX-9924', 3, 4, 'Siti Aminah', NULL, NULL, 'f', 5000000, 4000, 5004000, NULL, NULL, NULL, NULL, NULL, NULL, 'PAID', NULL, NULL, NULL, '2026-10-11 09:15:00+00', '2026-10-11 09:20:00+00');

INSERT INTO "public"."invoices_y2026m10" ("id", "invoice_code", "donor_id", "payment_method_id", "donor_name_snapshot", "donor_email", "donor_phone", "is_anonymous", "base_amount", "admin_fee", "total_amount", "fb_click_id", "fb_browser_id", "tiktok_click_id", "google_click_id", "client_ip_address", "client_user_agent", "status", "va_number", "payment_url", "qris_dynamic", "created_at", "paid_at") VALUES
(1, 'TRX-9921', 1, 1, 'Andi Dermawan', NULL, NULL, 'f', 100000, 0, 100000, 'fb.1.123abc456', NULL, NULL, NULL, '192.168.1.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)', 'PAID', NULL, NULL, NULL, '2026-10-12 14:30:00+00', '2026-10-12 14:32:00+00'),
(2, 'TRX-9922', NULL, 2, 'Hamba Allah', NULL, NULL, 't', 500000, 4000, 504000, NULL, NULL, NULL, NULL, NULL, NULL, 'PENDING', NULL, NULL, NULL, '2026-10-12 15:10:00+00', NULL),
(3, 'TRX-9923', 2, 3, 'Budi Santoso', NULL, NULL, 'f', 21000000, 4000, 21004000, NULL, NULL, 'tiktok.abc.123', NULL, '114.120.10.15', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'PAID', NULL, NULL, NULL, '2026-10-12 16:05:00+00', '2026-10-12 16:15:00+00'),
(4, 'TRX-9924', 3, 4, 'Siti Aminah', NULL, NULL, 'f', 5000000, 4000, 5004000, NULL, NULL, NULL, NULL, NULL, NULL, 'PAID', NULL, NULL, NULL, '2026-10-11 09:15:00+00', '2026-10-11 09:20:00+00');

INSERT INTO "public"."transactions" ("id", "invoice_id", "invoice_created_at", "campaign_id", "bundle_campaign_id", "variant_id", "affiliate_id", "qty", "amount", "affiliate_commission", "created_at") VALUES
(1, 1, '2026-10-12 14:30:00+00', 1, NULL, NULL, NULL, 1, 100000, 0, '2026-10-12 14:30:00+00'),
(2, 2, '2026-10-12 15:10:00+00', 5, NULL, NULL, NULL, 1, 500000, 0, '2026-10-12 15:10:00+00'),
(3, 3, '2026-10-12 16:05:00+00', 8, NULL, 4, NULL, 1, 21000000, 0, '2026-10-12 16:05:00+00'),
(4, 4, '2026-10-11 09:15:00+00', 11, NULL, NULL, NULL, 1, 5000000, 0, '2026-10-11 09:15:00+00');

INSERT INTO "public"."transactions_y2026m10" ("id", "invoice_id", "invoice_created_at", "campaign_id", "bundle_campaign_id", "variant_id", "affiliate_id", "qty", "amount", "affiliate_commission", "created_at") VALUES
(1, 1, '2026-10-12 14:30:00+00', 1, NULL, NULL, NULL, 1, 100000, 0, '2026-10-12 14:30:00+00'),
(2, 2, '2026-10-12 15:10:00+00', 5, NULL, NULL, NULL, 1, 500000, 0, '2026-10-12 15:10:00+00'),
(3, 3, '2026-10-12 16:05:00+00', 8, NULL, 4, NULL, 1, 21000000, 0, '2026-10-12 16:05:00+00'),
(4, 4, '2026-10-11 09:15:00+00', 11, NULL, NULL, NULL, 1, 5000000, 0, '2026-10-11 09:15:00+00');

INSERT INTO "public"."transaction_qurban_names" ("id", "transaction_id", "transaction_created_at", "mudhohi_name") VALUES
(1, 3, '2026-10-12 16:05:00+00', 'Budi Santoso'),
(2, 3, '2026-10-12 16:05:00+00', 'Istri Budi'),
(3, 3, '2026-10-12 16:05:00+00', 'Anak 1'),
(4, 3, '2026-10-12 16:05:00+00', 'Anak 2'),
(5, 3, '2026-10-12 16:05:00+00', 'Anak 3'),
(6, 3, '2026-10-12 16:05:00+00', 'Anak 4'),
(7, 3, '2026-10-12 16:05:00+00', 'Anak 5');

INSERT INTO "public"."payment_logs" ("id", "invoice_code", "endpoint", "request_payload", "response_payload", "http_status", "created_at") VALUES
(1, 'TRX-9921', 'https://api.midtrans.com/v2/charge', '{"payment_type": "gopay", "transaction_details": {"order_id": "TRX-9921", "gross_amount": 100000}}', '{"status_code": "201", "transaction_status": "pending", "actions": [{"name": "generate-qr-code", "url": "https://api.sandbox.midtrans.com/v2/gopay/123456/qr-code"}]}', 201, '2026-04-19 01:39:51.048594+00'),
(2, 'TRX-9922', 'https://api.xendit.co/v2/virtual_accounts', '{"external_id": "TRX-9922", "bank_code": "BCA", "name": "Hamba Allah", "expected_amount": 504000, "is_closed": true}', '{"id": "614c...va", "external_id": "TRX-9922", "bank_code": "BCA", "merchant_code": "8077", "account_number": "807708123456789", "expected_amount": 504000, "status": "PENDING"}', 200, '2026-04-19 01:39:51.048594+00'),
(3, 'TRX-9923', 'https://api.xendit.co/callback/virtual_accounts', '{"external_id": "TRX-9923", "amount": 21004000, "status": "COMPLETED", "transaction_timestamp": "2026-10-12T16:15:00.000Z"}', '{"status": "success", "message": "Callback processed and jobs queued"}', 200, '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."notification_templates" ("id", "event_trigger", "channel", "message_content", "is_active") VALUES
(1, 'DONATION_SUCCESS', 'WHATSAPP', 'Terima kasih {nama}, donasi Rp {nominal} via {metode} berhasil kami terima. Semoga membawa keberkahan.', 't'),
(2, 'INVOICE_PENDING', 'WHATSAPP', 'Halo {nama}, tagihan donasi Rp {nominal} menunggu pembayaran. Silakan transfer ke {metode} berikut: {va_number} sebelum kedaluwarsa.', 't');

INSERT INTO "public"."notification_logs" ("id", "template_id", "invoice_code", "recipient", "channel", "request_payload", "response_payload", "status", "created_at") VALUES
(1, 1, 'TRX-9921', '08123456789', 'WHATSAPP', '{"target": "08123456789", "message": "Terima kasih Andi Dermawan, donasi Rp 100.000 via GoPay berhasil kami terima. Semoga membawa keberkahan.", "countryCode": "62"}', '{"status": true, "detail": "message sent successfully", "process": "1 messages sent"}', 'SUCCESS', '2026-04-19 01:39:51.048594+00'),
(2, 2, 'TRX-9922', '08123456789', 'WHATSAPP', '{"target": "08123456789", "message": "Halo Hamba Allah, tagihan donasi Rp 504.000 menunggu pembayaran. Silakan transfer ke BCA Virtual Account berikut: 807708123456789 sebelum kedaluwarsa.", "countryCode": "62"}', '{"status": true, "detail": "message sent successfully"}', 'SUCCESS', '2026-04-19 01:39:51.048594+00');

INSERT INTO "public"."ads_conversion_logs" ("id", "invoice_code", "platform", "event_name", "request_payload", "response_payload", "http_status", "status", "created_at") VALUES
(1, 'TRX-9921', 'META_CAPI', 'Purchase', '{"data": [{"event_name": "Purchase", "event_time": 1791786600, "action_source": "website", "user_data": {"em": "78...hash...", "ph": "08...hash...", "client_ip_address": "192.168.1.1", "client_user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)", "fbc": "fb.1.123abc456"}, "custom_data": {"currency": "IDR", "value": 100000}}]}', '{"events_received": 1, "messages": [], "fbtrace_id": "Cabc123xyz"}', 200, 'SUCCESS', '2026-04-19 01:39:51.048594+00'),
(2, 'TRX-9923', 'TIKTOK_EVENTS_API', 'CompletePayment', '{"event": "CompletePayment", "event_time": 1791792900, "user": {"ttclid": "tiktok.abc.123", "ip": "114.120.10.15", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "phone": "08567890123"}, "properties": {"currency": "IDR", "value": 21000000}}', '{"code": 0, "message": "OK", "data": {"trace_id": "tt_trace_123456"}}', 200, 'SUCCESS', '2026-04-19 01:39:51.048594+00');



-- Indices
CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);
ALTER TABLE "public"."campaigns" ADD FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;


-- Indices
CREATE UNIQUE INDEX campaigns_slug_key ON public.campaigns USING btree (slug);
CREATE INDEX idx_campaigns_category ON public.campaigns USING btree (category_id);
CREATE INDEX idx_campaigns_status_created ON public.campaigns USING btree (status, created_at DESC);
CREATE INDEX idx_campaigns_urgent ON public.campaigns USING btree (is_urgent) WHERE (is_urgent = true);
ALTER TABLE "public"."campaign_qris_static" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX campaign_qris_static_external_id_key ON public.campaign_qris_static USING btree (external_id);
CREATE INDEX idx_campaign_qris_campaign ON public.campaign_qris_static USING btree (campaign_id);
ALTER TABLE "public"."campaign_bundles" ADD FOREIGN KEY ("bundle_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;
ALTER TABLE "public"."campaign_bundles" ADD FOREIGN KEY ("item_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_campaign_bundles_bundle ON public.campaign_bundles USING btree (bundle_campaign_id);
ALTER TABLE "public"."campaign_variants" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_campaign_variants_campaign ON public.campaign_variants USING btree (campaign_id);
ALTER TABLE "public"."campaign_stats" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;
ALTER TABLE "public"."campaign_updates" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_campaign_updates_campaign ON public.campaign_updates USING btree (campaign_id, created_at DESC);


-- Indices
CREATE UNIQUE INDEX affiliates_affiliate_code_key ON public.affiliates USING btree (affiliate_code);
CREATE UNIQUE INDEX affiliates_email_key ON public.affiliates USING btree (email);
ALTER TABLE "public"."affiliate_commissions" ADD FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE;
ALTER TABLE "public"."affiliate_commissions" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;
ALTER TABLE "public"."affiliate_campaign_stats" ADD FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE CASCADE;
ALTER TABLE "public"."affiliate_campaign_stats" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;
ALTER TABLE "public"."withdrawals" ADD FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id");


-- Indices
CREATE INDEX idx_withdrawals_affiliate ON public.withdrawals USING btree (affiliate_id);
ALTER TABLE "public"."payment_instructions" ADD FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_donors_email ON public.donors USING btree (email);
ALTER TABLE "public"."invoices" ADD FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."invoices" ADD FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE SET NULL;


-- Indices
CREATE UNIQUE INDEX invoices_invoice_code_created_at_key ON ONLY public.invoices USING btree (invoice_code, created_at);
CREATE INDEX idx_invoices_created_at ON ONLY public.invoices USING btree (created_at);
CREATE INDEX idx_invoices_status ON ONLY public.invoices USING btree (status);
CREATE INDEX idx_invoices_donor ON ONLY public.invoices USING btree (donor_id);
ALTER TABLE "public"."invoices_y2026m10" ADD FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE SET NULL;
ALTER TABLE "public"."invoices_y2026m10" ADD FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT;


-- Indices
CREATE UNIQUE INDEX invoices_y2026m10_invoice_code_created_at_key ON public.invoices_y2026m10 USING btree (invoice_code, created_at);
CREATE INDEX invoices_y2026m10_created_at_idx ON public.invoices_y2026m10 USING btree (created_at);
CREATE INDEX invoices_y2026m10_status_idx ON public.invoices_y2026m10 USING btree (status);
CREATE INDEX invoices_y2026m10_donor_id_idx ON public.invoices_y2026m10 USING btree (donor_id);
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("invoice_id","invoice_created_at") REFERENCES "public"."invoices_y2026m10"("id","created_at") ON DELETE CASCADE;
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("invoice_id","invoice_created_at") REFERENCES "public"."invoices"("id","created_at") ON DELETE CASCADE;
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("variant_id") REFERENCES "public"."campaign_variants"("id") ON DELETE SET NULL;
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE SET NULL;
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."transactions" ADD FOREIGN KEY ("bundle_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;


-- Indices
CREATE INDEX idx_transactions_campaign ON ONLY public.transactions USING btree (campaign_id);
CREATE INDEX idx_transactions_created_at ON ONLY public.transactions USING btree (created_at);
CREATE INDEX idx_transactions_invoice ON ONLY public.transactions USING btree (invoice_id);
CREATE INDEX idx_transactions_affiliate ON ONLY public.transactions USING btree (affiliate_id);
ALTER TABLE "public"."transactions_y2026m10" ADD FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE RESTRICT;
ALTER TABLE "public"."transactions_y2026m10" ADD FOREIGN KEY ("invoice_id","invoice_created_at") REFERENCES "public"."invoices"("id","created_at") ON DELETE CASCADE;
ALTER TABLE "public"."transactions_y2026m10" ADD FOREIGN KEY ("bundle_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;
ALTER TABLE "public"."transactions_y2026m10" ADD FOREIGN KEY ("variant_id") REFERENCES "public"."campaign_variants"("id") ON DELETE SET NULL;
ALTER TABLE "public"."transactions_y2026m10" ADD FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE SET NULL;


-- Indices
CREATE INDEX transactions_y2026m10_campaign_id_idx ON public.transactions_y2026m10 USING btree (campaign_id);
CREATE INDEX transactions_y2026m10_created_at_idx ON public.transactions_y2026m10 USING btree (created_at);
CREATE INDEX transactions_y2026m10_invoice_id_idx ON public.transactions_y2026m10 USING btree (invoice_id);
CREATE INDEX transactions_y2026m10_affiliate_id_idx ON public.transactions_y2026m10 USING btree (affiliate_id);
ALTER TABLE "public"."transaction_qurban_names" ADD FOREIGN KEY ("transaction_id","transaction_created_at") REFERENCES "public"."transactions_y2026m10"("id","created_at") ON DELETE CASCADE;
ALTER TABLE "public"."transaction_qurban_names" ADD FOREIGN KEY ("transaction_id","transaction_created_at") REFERENCES "public"."transactions"("id","created_at") ON DELETE CASCADE;


-- Indices
CREATE INDEX idx_transaction_qurban_trx ON public.transaction_qurban_names USING btree (transaction_id);


-- Indices
CREATE INDEX idx_payment_logs_invoice ON public.payment_logs USING btree (invoice_code);


-- Indices
CREATE UNIQUE INDEX notification_templates_event_trigger_key ON public.notification_templates USING btree (event_trigger);
ALTER TABLE "public"."notification_logs" ADD FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;


-- Indices
CREATE INDEX idx_notification_logs_template ON public.notification_logs USING btree (template_id);
CREATE INDEX idx_notification_logs_invoice ON public.notification_logs USING btree (invoice_code);


-- Indices
CREATE INDEX idx_ads_conversion_logs_invoice ON public.ads_conversion_logs USING btree (invoice_code);
