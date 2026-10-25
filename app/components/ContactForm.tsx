"use client";

export function ContactForm() {
  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => e.preventDefault()}
    >
      <input
        type="text"
        placeholder="Họ và tên"
        required
        className="w-full rounded border border-ink/18 bg-cream px-4 py-3.5 text-sm text-ink focus:border-wine focus:outline-none"
      />
      <input
        type="tel"
        placeholder="Số điện thoại"
        required
        className="w-full rounded border border-ink/18 bg-cream px-4 py-3.5 text-sm text-ink focus:border-wine focus:outline-none"
      />
      <input
        type="email"
        placeholder="Email"
        required
        className="w-full rounded border border-ink/18 bg-cream px-4 py-3.5 text-sm text-ink focus:border-wine focus:outline-none"
      />
      <button
        type="submit"
        className="w-full bg-wine px-8 py-4 text-[13px] font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-wine-deep"
      >
        Gửi yêu cầu tư vấn
      </button>
    </form>
  );
}
