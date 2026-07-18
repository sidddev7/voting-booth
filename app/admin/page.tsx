import { AdminConnectButton } from "@/components/admin/connect-button";
import { Container } from "@/components/container";

export default function AdminPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 py-10">
      <Container>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 max-w-xl text-zinc-600">
          Wallet-based auth for the trusted operator. Citizens use the
          email-based, walletless flow instead.
        </p>
        <div className="mt-6">
          <AdminConnectButton />
        </div>
      </Container>
    </main>
  );
}
