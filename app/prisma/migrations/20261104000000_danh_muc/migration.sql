/*
  Mo rong UC-15 (FR-ADM-03): bang DanhMuc de Admin tao danh muc truoc khi co san pham.
  Bang ngoai ERD SRS, bo sung co chu dich. Danh muc hieu luc = DanhMuc UNION SanPham.danhMuc.
*/
BEGIN TRY

BEGIN TRAN;

CREATE TABLE [dbo].[DanhMuc] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ten] NVARCHAR(1000) NOT NULL,
    [ngayTao] DATETIME2 NOT NULL CONSTRAINT [DanhMuc_ngayTao_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DanhMuc_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DanhMuc_ten_key] UNIQUE NONCLUSTERED ([ten])
);

ALTER TABLE [dbo].[DanhMuc] ADD CONSTRAINT [DanhMuc_id_df] DEFAULT NEWID() FOR [id];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
