export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-wine-deep px-5 pb-8 pt-20 text-center text-cream sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(184,144,63,0.22), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto mb-16 flex max-w-[1240px] flex-wrap justify-between gap-6 text-left">
        <div>
          <strong className="mb-2.5 block text-[11px] uppercase tracking-wider text-gold">
            Sản phẩm
          </strong>
          <p className="text-[13px] leading-relaxed text-cream/75">
            Mua đứt &amp; cho thuê theo ngày
            <br />
            Board game chọn lọc
          </p>
        </div>
        <div>
          <strong className="mb-2.5 block text-[11px] uppercase tracking-wider text-gold">
            Hỗ trợ
          </strong>
          <p className="text-[13px] leading-relaxed text-cream/75">
            Hướng dẫn đặt thuê
            <br />
            Chính sách hoàn cọc
          </p>
        </div>
        <div className="text-left sm:text-right">
          <strong className="mb-2.5 block text-[11px] uppercase tracking-wider text-gold">
            Đối tác
          </strong>
          <p className="text-[13px] leading-relaxed text-cream/75">
            Giao vận: Green SM (giả định)
            <br />
            Thanh toán: MoMo (giả định)
          </p>
        </div>
      </div>

      <h2 className="relative z-10 mb-2 font-script text-[clamp(56px,8vw,110px)] font-normal leading-none">
        BoardVerse
      </h2>
      <p className="relative z-10 mb-12 text-[13px] text-cream/65">
        Một hộp game mỗi lần. Không gì khác xen vào.
      </p>

      <div className="relative z-10 mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-cream/10 pt-6 text-[11px] text-cream/45">
        <span>© 2026 BoardVerse — Hộ kinh doanh BoardVerse (giả định)</span>
        <span>Quận 1, TP. Hồ Chí Minh</span>
      </div>
    </footer>
  );
}
