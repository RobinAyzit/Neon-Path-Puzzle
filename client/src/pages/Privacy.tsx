import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <main className="safe-scroll h-full overflow-y-auto bg-background px-5 py-8 text-foreground">
      <section className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-black/40 p-6 shadow-[0_0_30px_rgba(0,243,255,0.08)] md:p-10">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-primary transition-colors hover:text-white"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary md:text-4xl">PRIVACY POLICY</h1>
        </div>

        <div className="space-y-5 font-exo leading-relaxed text-muted-foreground">
          <p className="text-sm">Last updated: 23 July 2026</p>
          <p>
            Neon Path Puzzle does not collect, transmit, sell, or share personal data.
          </p>
          <div>
            <h2 className="mb-2 text-lg font-bold text-foreground">Data stored on your device</h2>
            <p>
              Level progress, settings, achievements, and your anonymous local player identifier are stored only on your device. Removing the app or clearing its storage may delete this data.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-bold text-foreground">Permissions and services</h2>
            <p>
              The game uses vibration for optional gameplay feedback. It contains no advertising, analytics, accounts, purchases, or third-party tracking services.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-lg font-bold text-foreground">Contact</h2>
            <p>
              Questions may be sent to <a className="text-primary underline" href="mailto:bynrnworld@gmail.com">bynrnworld@gmail.com</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
