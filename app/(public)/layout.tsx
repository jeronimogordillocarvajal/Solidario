import { StoreFooter, StoreHeader } from "@/components/store-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <StoreFooter />
    </>
  );
}
