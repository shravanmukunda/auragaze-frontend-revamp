"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using the AURAGAZE website, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not access the website or use our services. These terms apply to all visitors, users, and customers of AURAGAZE.",
  },
  {
    title: "2. Products & Orders",
    content:
      "All product images are for illustrative purposes only. While we strive to display accurate colours and designs, we cannot guarantee that your screen's display will accurately reflect the actual product. We reserve the right to modify or discontinue any product without prior notice. All orders are subject to acceptance and availability.",
  },
  {
    title: "3. Pricing & Payments",
    content:
      "All prices are listed in Indian Rupees (INR) and inclusive of applicable taxes. We reserve the right to revise prices at any time without prior notice. Payment must be received in full before orders are processed. We accept major credit cards, debit cards, and other payment methods as displayed at checkout.",
  },
  {
    title: "4. Shipping & Delivery",
    content:
      "We ship to addresses within India. Delivery timelines are estimates and not guaranteed. AURAGAZE is not liable for delays caused by courier partners or unforeseen circumstances. Risk of loss and title for products pass to you upon delivery. Shipping charges, if applicable, will be displayed at checkout.",
  },
  {
    title: "5. Returns & Exchanges",
    content:
      "We accept returns and exchanges within 14 days of delivery, provided the product is unused, unwashed, and in its original condition with all tags attached. Customised or sale items may not be eligible for return. Return shipping costs are borne by the customer unless the product is defective or incorrect.",
  },
  {
    title: "6. Intellectual Property",
    content:
      "All content on this website — including logos, designs, text, graphics, and images — is the property of AURAGAZE or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.",
  },
  {
    title: "7. User Conduct",
    content:
      "You agree not to use the website for any unlawful purpose or in violation of these terms. You must not attempt to gain unauthorised access to our systems, interfere with the website's functionality, or engage in any activity that disrupts the shopping experience of other users.",
  },
  {
    title: "8. Limitation of Liability",
    content:
      "AURAGAZE shall not be liable for any indirect, incidental, or consequential damages arising from your use of the website or purchase of products. Our total liability shall not exceed the amount paid by you for the product in question.",
  },
  {
    title: "9. Privacy Policy",
    content:
      "Your use of the website is also governed by our Privacy Policy. By using our services, you consent to the collection and use of your information as described in the Privacy Policy. We are committed to protecting your personal data and ensuring transparency in how we handle it.",
  },
  {
    title: "10. Changes to Terms",
    content:
      "We reserve the right to update or modify these terms at any time without prior notice. Changes will be effective immediately upon posting on this page. Your continued use of the website after any changes constitutes acceptance of the new terms.",
  },
  {
    title: "11. Contact Us",
    content:
      "If you have any questions regarding these Terms and Conditions, please reach out to our support team. We value your feedback and are here to help with any concerns.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Terms & Conditions" />

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
            Terms &amp;
            <br />
            <span className="text-brand">Conditions</span>
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
