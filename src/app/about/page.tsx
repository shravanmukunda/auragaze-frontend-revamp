import Link from "next/link";
import TopBar from "@/components/TopBar";

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-6">
      <TopBar title="About" />

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-16">
        <section className="surface-card rounded-2xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] label-accent">
            AURAGAZE
          </p>
          <h1 className="mt-2 font-heading text-3xl font-black tracking-tight">
            Dress With Intention
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            AURAGAZE is a mobile-first destination for oversized tees, graphic
            drops, and everyday streetwear essentials. We focus on premium cotton,
            relaxed fits, and limited runs you can actually wear.
          </p>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <h2 className="font-bold">What we stand for</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-strong">
            <li>Oversized silhouettes built for comfort and statement.</li>
            <li>Curated graphics, basics, and full-sleeve drops.</li>
            <li>Transparent sizing, live stock, and COD checkout across India.</li>
          </ul>
        </section>

        <Link href="/shop" className="btn-gradient flex h-12 items-center justify-center rounded-2xl text-sm font-bold">
          Shop the collection
        </Link>
      </div>
    </div>
  );
}
