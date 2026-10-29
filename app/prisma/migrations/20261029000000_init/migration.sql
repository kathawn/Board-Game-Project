BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[KhachHang] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [hoTen] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [sdt] NVARCHAR(1000) NOT NULL CONSTRAINT [KhachHang_sdt_df] DEFAULT '',
    [diaChi] NVARCHAR(1000) NOT NULL CONSTRAINT [KhachHang_diaChi_df] DEFAULT '',
    [matKhauHash] NVARCHAR(1000) NOT NULL,
    [soLanSai] INT NOT NULL CONSTRAINT [KhachHang_soLanSai_df] DEFAULT 0,
    [khoaDen] DATETIME2,
    CONSTRAINT [KhachHang_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [KhachHang_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ViDienTu] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [khachHangId] UNIQUEIDENTIFIER NOT NULL,
    [soDu] DECIMAL(12,0) NOT NULL CONSTRAINT [ViDienTu_soDu_df] DEFAULT 0,
    CONSTRAINT [ViDienTu_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ViDienTu_khachHangId_key] UNIQUE NONCLUSTERED ([khachHangId])
);

-- CreateTable
CREATE TABLE [dbo].[ButToanVi] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [viId] UNIQUEIDENTIFIER NOT NULL,
    [soTien] DECIMAL(12,0) NOT NULL,
    [lyDo] NVARCHAR(1000) NOT NULL,
    [thanhToanId] UNIQUEIDENTIFIER,
    [maGiaoDich] NVARCHAR(1000),
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [ButToanVi_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ButToanVi_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SanPham] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [ten] NVARCHAR(1000) NOT NULL,
    [moTa] NVARCHAR(1000) NOT NULL CONSTRAINT [SanPham_moTa_df] DEFAULT '',
    [giaNiemYet] DECIMAL(12,0) NOT NULL,
    [danhMuc] NVARCHAR(1000) NOT NULL,
    [anhUrl] NVARCHAR(1000),
    CONSTRAINT [SanPham_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SanPham_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[HopGame] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sanPhamId] UNIQUEIDENTIFIER NOT NULL,
    [maHop] NVARCHAR(1000) NOT NULL,
    [trangThai] NVARCHAR(1000) NOT NULL CONSTRAINT [HopGame_trangThai_df] DEFAULT 'Available',
    CONSTRAINT [HopGame_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [HopGame_maHop_key] UNIQUE NONCLUSTERED ([maHop])
);

-- CreateTable
CREATE TABLE [dbo].[LinhKien] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sanPhamId] UNIQUEIDENTIFIER NOT NULL,
    [tenLinhKien] NVARCHAR(1000) NOT NULL,
    [laDocBan] BIT NOT NULL CONSTRAINT [LinhKien_laDocBan_df] DEFAULT 0,
    CONSTRAINT [LinhKien_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DanhGia] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sanPhamId] UNIQUEIDENTIFIER NOT NULL,
    [khachHangId] UNIQUEIDENTIFIER NOT NULL,
    [donHangId] UNIQUEIDENTIFIER NOT NULL,
    [soSao] INT NOT NULL,
    [nhanXet] NVARCHAR(1000),
    [ngayDanhGia] DATETIME2 NOT NULL CONSTRAINT [DanhGia_ngayDanhGia_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DanhGia_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NhanVien] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [hoTen] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [matKhauHash] NVARCHAR(1000) NOT NULL,
    [vaiTro] NVARCHAR(1000) NOT NULL,
    [dangHoatDong] BIT NOT NULL CONSTRAINT [NhanVien_dangHoatDong_df] DEFAULT 1,
    CONSTRAINT [NhanVien_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [NhanVien_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[DonHang] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [maDon] NVARCHAR(1000) NOT NULL,
    [khachHangId] UNIQUEIDENTIFIER NOT NULL,
    [loai] NVARCHAR(1000) NOT NULL,
    [trangThai] NVARCHAR(1000) NOT NULL CONSTRAINT [DonHang_trangThai_df] DEFAULT 'Pending',
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [DonHang_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DonHang_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DonHang_maDon_key] UNIQUE NONCLUSTERED ([maDon])
);

-- CreateTable
CREATE TABLE [dbo].[ChiTietDonHang] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [donHangId] UNIQUEIDENTIFIER NOT NULL,
    [sanPhamId] UNIQUEIDENTIFIER NOT NULL,
    [soLuong] INT NOT NULL CONSTRAINT [ChiTietDonHang_soLuong_df] DEFAULT 1,
    [ngayBatDau] DATE,
    [ngayKetThuc] DATE,
    [tienThue] DECIMAL(12,0),
    [tienCoc] DECIMAL(12,0),
    [donGia] DECIMAL(12,0) NOT NULL,
    [diaChiNhan] NVARCHAR(1000) NOT NULL,
    [diaChiTra] NVARCHAR(1000),
    CONSTRAINT [ChiTietDonHang_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DatCoc] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [donHangId] UNIQUEIDENTIFIER NOT NULL,
    [soTien] DECIMAL(12,0) NOT NULL,
    [phiShipGiu] DECIMAL(12,0) NOT NULL CONSTRAINT [DatCoc_phiShipGiu_df] DEFAULT 0,
    [trangThai] NVARCHAR(1000) NOT NULL CONSTRAINT [DatCoc_trangThai_df] DEFAULT 'Held',
    [ngayHoan] DATE,
    CONSTRAINT [DatCoc_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DatCoc_donHangId_key] UNIQUE NONCLUSTERED ([donHangId])
);

-- CreateTable
CREATE TABLE [dbo].[GiaoVan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [chiTietDonId] UNIQUEIDENTIFIER NOT NULL,
    [chieu] NVARCHAR(1000) NOT NULL,
    [doiTac] NVARCHAR(1000) NOT NULL,
    [khoangCachKm] DECIMAL(6,2) NOT NULL,
    [phiShip] DECIMAL(12,0) NOT NULL,
    [maVanDon] NVARCHAR(1000),
    [trangThaiVanChuyen] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [GiaoVan_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ThanhToan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [maThanhToan] NVARCHAR(1000) NOT NULL,
    [donHangId] UNIQUEIDENTIFIER,
    [khachHangId] UNIQUEIDENTIFIER NOT NULL,
    [soTien] DECIMAL(12,0) NOT NULL,
    [mucDich] NVARCHAR(1000) NOT NULL,
    [trangThai] NVARCHAR(1000) NOT NULL CONSTRAINT [ThanhToan_trangThai_df] DEFAULT 'ChoThanhToan',
    [ketQua] NVARCHAR(1000),
    [maQR] NVARCHAR(1000),
    [taoLuc] DATETIME2 NOT NULL CONSTRAINT [ThanhToan_taoLuc_df] DEFAULT CURRENT_TIMESTAMP,
    [hetHanLuc] DATETIME2 NOT NULL,
    [snapshot] NVARCHAR(max) NOT NULL,
    [soTienHoan] DECIMAL(12,0) NOT NULL CONSTRAINT [ThanhToan_soTienHoan_df] DEFAULT 0,
    CONSTRAINT [ThanhToan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ThanhToan_maThanhToan_key] UNIQUE NONCLUSTERED ([maThanhToan])
);

-- CreateTable
CREATE TABLE [dbo].[GiaoDichThanhToan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [thanhToanId] UNIQUEIDENTIFIER NOT NULL,
    [maGiaoDich] NVARCHAR(1000) NOT NULL,
    [soTien] DECIMAL(12,0) NOT NULL,
    [ketQuaMa] INT NOT NULL,
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [GiaoDichThanhToan_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [GiaoDichThanhToan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [GiaoDichThanhToan_thanhToanId_maGiaoDich_key] UNIQUE NONCLUSTERED ([thanhToanId],[maGiaoDich])
);

-- CreateTable
CREATE TABLE [dbo].[BienBanKiemDem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [chiTietDonId] UNIQUEIDENTIFIER NOT NULL,
    [nhanVienId] UNIQUEIDENTIFIER NOT NULL,
    [ketQua] NVARCHAR(1000) NOT NULL,
    [ngayLap] DATETIME2 NOT NULL CONSTRAINT [BienBanKiemDem_ngayLap_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [BienBanKiemDem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [HopGame_trangThai_idx] ON [dbo].[HopGame]([trangThai]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LinhKien_sanPhamId_idx] ON [dbo].[LinhKien]([sanPhamId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DanhGia_sanPhamId_idx] ON [dbo].[DanhGia]([sanPhamId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DonHang_khachHangId_idx] ON [dbo].[DonHang]([khachHangId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [DonHang_trangThai_idx] ON [dbo].[DonHang]([trangThai]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ChiTietDonHang_sanPhamId_ngayBatDau_ngayKetThuc_idx] ON [dbo].[ChiTietDonHang]([sanPhamId], [ngayBatDau], [ngayKetThuc]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ThanhToan_donHangId_trangThai_idx] ON [dbo].[ThanhToan]([donHangId], [trangThai]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ThanhToan_khachHangId_idx] ON [dbo].[ThanhToan]([khachHangId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [BienBanKiemDem_chiTietDonId_idx] ON [dbo].[BienBanKiemDem]([chiTietDonId]);

-- AddForeignKey
ALTER TABLE [dbo].[ViDienTu] ADD CONSTRAINT [ViDienTu_khachHangId_fkey] FOREIGN KEY ([khachHangId]) REFERENCES [dbo].[KhachHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ButToanVi] ADD CONSTRAINT [ButToanVi_viId_fkey] FOREIGN KEY ([viId]) REFERENCES [dbo].[ViDienTu]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[HopGame] ADD CONSTRAINT [HopGame_sanPhamId_fkey] FOREIGN KEY ([sanPhamId]) REFERENCES [dbo].[SanPham]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[LinhKien] ADD CONSTRAINT [LinhKien_sanPhamId_fkey] FOREIGN KEY ([sanPhamId]) REFERENCES [dbo].[SanPham]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DanhGia] ADD CONSTRAINT [DanhGia_sanPhamId_fkey] FOREIGN KEY ([sanPhamId]) REFERENCES [dbo].[SanPham]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DanhGia] ADD CONSTRAINT [DanhGia_khachHangId_fkey] FOREIGN KEY ([khachHangId]) REFERENCES [dbo].[KhachHang]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DanhGia] ADD CONSTRAINT [DanhGia_donHangId_fkey] FOREIGN KEY ([donHangId]) REFERENCES [dbo].[DonHang]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DonHang] ADD CONSTRAINT [DonHang_khachHangId_fkey] FOREIGN KEY ([khachHangId]) REFERENCES [dbo].[KhachHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietDonHang] ADD CONSTRAINT [ChiTietDonHang_donHangId_fkey] FOREIGN KEY ([donHangId]) REFERENCES [dbo].[DonHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChiTietDonHang] ADD CONSTRAINT [ChiTietDonHang_sanPhamId_fkey] FOREIGN KEY ([sanPhamId]) REFERENCES [dbo].[SanPham]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DatCoc] ADD CONSTRAINT [DatCoc_donHangId_fkey] FOREIGN KEY ([donHangId]) REFERENCES [dbo].[DonHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GiaoVan] ADD CONSTRAINT [GiaoVan_chiTietDonId_fkey] FOREIGN KEY ([chiTietDonId]) REFERENCES [dbo].[ChiTietDonHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ThanhToan] ADD CONSTRAINT [ThanhToan_donHangId_fkey] FOREIGN KEY ([donHangId]) REFERENCES [dbo].[DonHang]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GiaoDichThanhToan] ADD CONSTRAINT [GiaoDichThanhToan_thanhToanId_fkey] FOREIGN KEY ([thanhToanId]) REFERENCES [dbo].[ThanhToan]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BienBanKiemDem] ADD CONSTRAINT [BienBanKiemDem_chiTietDonId_fkey] FOREIGN KEY ([chiTietDonId]) REFERENCES [dbo].[ChiTietDonHang]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[BienBanKiemDem] ADD CONSTRAINT [BienBanKiemDem_nhanVienId_fkey] FOREIGN KEY ([nhanVienId]) REFERENCES [dbo].[NhanVien]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Thu cong (khong do Prisma sinh): SQL Server coi NULL la 1 gia tri trong UNIQUE
-- constraint, nen cot nullable phai dung unique index co dieu kien (filtered).
-- ---------------------------------------------------------------------------
CREATE UNIQUE NONCLUSTERED INDEX [uq_giaovan_mavandon] ON [dbo].[GiaoVan]([maVanDon]) WHERE [maVanDon] IS NOT NULL;
CREATE UNIQUE NONCLUSTERED INDEX [uq_thanhtoan_maqr] ON [dbo].[ThanhToan]([maQR]) WHERE [maQR] IS NOT NULL;
CREATE UNIQUE NONCLUSTERED INDEX [uq_butttoanvi_thanhtoan_giaodich] ON [dbo].[ButToanVi]([thanhToanId],[maGiaoDich]) WHERE [thanhToanId] IS NOT NULL AND [maGiaoDich] IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Thu cong: CHECK thay cho ENUM (SDD muc 4) va cac rang buoc cua ERD (SRS 3.5).
-- ---------------------------------------------------------------------------
ALTER TABLE [dbo].[ViDienTu]       ADD CONSTRAINT [ck_vidientu_sodu]        CHECK ([soDu] >= 0);
ALTER TABLE [dbo].[HopGame]        ADD CONSTRAINT [ck_hopgame_trangthai]    CHECK ([trangThai] IN ('Available','Reserved','Rented','Checking','Damaged','Sold'));
ALTER TABLE [dbo].[NhanVien]       ADD CONSTRAINT [ck_nhanvien_vaitro]      CHECK ([vaiTro] IN ('Staff','Admin'));
ALTER TABLE [dbo].[DonHang]        ADD CONSTRAINT [ck_donhang_loai]         CHECK ([loai] IN ('Ban','Thue'));
ALTER TABLE [dbo].[DonHang]        ADD CONSTRAINT [ck_donhang_trangthai]    CHECK ([trangThai] IN ('Pending','Confirmed','Active','Overdue','Completed','Closed'));
ALTER TABLE [dbo].[DatCoc]         ADD CONSTRAINT [ck_datcoc_trangthai]     CHECK ([trangThai] IN ('Held','Refunded','Partially_Refunded'));
ALTER TABLE [dbo].[DatCoc]         ADD CONSTRAINT [ck_datcoc_sotien]        CHECK ([soTien] >= 0 AND [phiShipGiu] >= 0);
ALTER TABLE [dbo].[GiaoVan]        ADD CONSTRAINT [ck_giaovan_chieu]        CHECK ([chieu] IN ('Nhan','Tra'));
ALTER TABLE [dbo].[GiaoVan]        ADD CONSTRAINT [ck_giaovan_doitac]       CHECK ([doiTac] IN ('GreenSM','ShopeeExpress'));
ALTER TABLE [dbo].[GiaoVan]        ADD CONSTRAINT [ck_giaovan_trangthai]    CHECK ([trangThaiVanChuyen] IN ('DangGiao','DaGiao','DangLay','DaLay'));
ALTER TABLE [dbo].[GiaoVan]        ADD CONSTRAINT [ck_giaovan_so]           CHECK ([khoangCachKm] >= 0 AND [phiShip] >= 0);
ALTER TABLE [dbo].[ThanhToan]      ADD CONSTRAINT [ck_thanhtoan_mucdich]    CHECK ([mucDich] IN ('TienHang','TienCoc','ThuThem'));
ALTER TABLE [dbo].[ThanhToan]      ADD CONSTRAINT [ck_thanhtoan_trangthai]  CHECK ([trangThai] IN ('ChoThanhToan','DaThanhToan','HetHieuLuc'));
ALTER TABLE [dbo].[ThanhToan]      ADD CONSTRAINT [ck_thanhtoan_sotien]     CHECK ([soTien] >= 0 AND [soTienHoan] >= 0);
ALTER TABLE [dbo].[DanhGia]        ADD CONSTRAINT [ck_danhgia_sosao]        CHECK ([soSao] BETWEEN 1 AND 5);
ALTER TABLE [dbo].[ChiTietDonHang] ADD CONSTRAINT [ck_chitiet_soluong]      CHECK ([soLuong] >= 1);
ALTER TABLE [dbo].[ChiTietDonHang] ADD CONSTRAINT [ck_chitiet_dongia]       CHECK ([donGia] >= 0);
-- Don thue: ngay ket thuc phai sau ngay bat dau (ERD ChiTietDonHang).
ALTER TABLE [dbo].[ChiTietDonHang] ADD CONSTRAINT [ck_chitiet_ngay]         CHECK ([ngayBatDau] IS NULL OR [ngayKetThuc] > [ngayBatDau]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

