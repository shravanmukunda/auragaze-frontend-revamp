"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "When you visit or make a purchase from AURAGAZE, we collect certain information you provide directly — such as your name, email address, phone number, shipping address, and payment details. We also automatically collect information about your device, browsing actions, and usage patterns through cookies and similar technologies to improve your shopping experience.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use the information we collect to process and fulfil your orders, communicate with you about your purchases, send you updates and promotional offers (with your consent), improve our website and products, and comply with legal obligations. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Payment Processing",
    content:
      "All payment transactions are processed through secure third-party payment gateways. We do not store your full payment card details on our servers. Your payment information is encrypted and handled in compliance with industry security standards to ensure your data remains safe.",
  },
  {
    title: "4. Cookies & Tracking",
    content:
      "We use cookies and similar tracking technologies to enhance your browsing experience, analyse site traffic, and understand where our visitors come from. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our website.",
  },
  {
    title: "5. Data Sharing & Disclosure",
    content:
      "We may share your personal information with trusted third-party service providers who assist us in operating our website, processing payments, delivering orders, and sending communications. These providers are contractually bound to protect your data. We may also disclose information when required by law.",
  },
  {
    title: "6. Data Retention",
    content:
      "We retain your personal information for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required by law. When we no longer need your data, we will securely delete or anonymise it.",
  },
  {
    title: "7. Your Rights",
    content:
      "You have the right to access, correct, or delete your personal information held by us. You may also object to or restrict certain processing of your data. To exercise these rights, please contact us. We will respond to your request within the timeframe required by applicable law.",
  },
  {
    title: "8. Data Security",
    content:
      "We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "9. Third-Party Links",
    content:
      "Our website may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those sites. We encourage you to review the privacy policies of any third-party services you interact with through our website.",
  },
  {
    title: "10. Children's Privacy",
    content:
      "Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete such information promptly.",
  },
  {
    title: "11. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or operational reasons. We will notify you of any material changes by posting the updated policy on this page with a revised date. Your continued use of our services after changes constitutes acceptance.",
  },
  {
    title: "12. Contact Us",
    content:
      "If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please reach out to our support team. We are committed to addressing your concerns and protecting your privacy.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Privacy Policy" />

      <div className="pt-16 max-w-lg mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <p className="text-[11px] font-semibold label-accent uppercase tracking-widest mb-1">
            Legal
          </p>
          <h1 className="text-3xl font-black leading-tight" style={{ color: "var(--foreground)" }}>
            Privacy
            <br />
            <span className="text-brand">Policy</span>
          </h1>
        </motion.div>

        {/* Content Sections */}
        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2
                className="font-bold text-base mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center text-xs mt-8 mb-4"
          style={{ color: "var(--muted)" }}
        >
          Last updated: July 2026
        </motion.p>
      </div>
    </div>
  );
}
