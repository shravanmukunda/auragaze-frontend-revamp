"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";

const sections = [
  {
    title: "1. 30-Day Refund Guarantee",
    content:
      "We want you to love your AURAGAZE tees. If you are not completely satisfied with your purchase, you may return unworn, unwashed, undamaged items within 30 days of the delivery date for a full refund to your original payment method. Requests must be initiated within 30 days — after that, we unfortunately cannot offer a refund or exchange.",
  },
  {
    title: "2. Condition Requirements",
    content:
      "All returned items must be unused, unwashed, and in their original condition with all tags still attached. We recommend trying on your purchase gently — please avoid any contact with deodorant, perfume, makeup, or lotion, as items showing signs of wear, stains, odours, or damage will not be accepted and may be returned to you.",
  },
  {
    title: "3. How to Initiate a Return",
    content:
      "To start a return, log into your account and navigate to your order history, or contact our support team with your order number and the item(s) you wish to return. We will provide you with a return shipping label and instructions. Once your return is registered, you have 10 business days to ship the item back to us.",
  },
  {
    title: "4. Refund Processing",
    content:
      "Once we receive your return and verify it meets our policy, we will process your refund within 2–3 business days. The refund will be issued to the original payment method and may take an additional 5–7 business days to appear in your account, depending on your bank or card issuer. You will receive an email confirmation when your refund has been processed.",
  },
  {
    title: "5. Non-Refundable Charges",
    content:
      "Shipping and handling charges are non-refundable, except in cases where the item is defective or we made an error with your order. If you are returning an item for reasons other than a defect or error, the cost of return shipping will be deducted from your refund. Original shipping fees are not refunded.",
  },
  {
    title: "6. Exchanges",
    content:
      "We offer free exchanges for a different size or colour within the same 30-day window, subject to stock availability. Exchanges are processed once your return is in transit back to us. If the requested variant is out of stock, we will issue a full refund instead. For faster service, we recommend placing a new order and returning the original item.",
  },
  {
    title: "7. Final Sale & Exclusions",
    content:
      "Certain items are marked as final sale and cannot be returned or exchanged. This includes customised or personalised products, sale items purchased at a discounted rate, and accessories. Please check the product page before purchasing — final sale items are clearly labelled at checkout.",
  },
  {
    title: "8. Defective or Incorrect Items",
    content:
      "If you receive a defective, damaged, or incorrect item, please contact us within 7 days of delivery. We will provide a prepaid return label and ship a replacement at no additional cost to you. If the item is out of stock, we will issue a full refund including the original shipping charges.",
  },
  {
    title: "9. International Returns",
    content:
      "For orders shipped outside of India, return shipping costs and any applicable customs or duties are the responsibility of the customer. Please contact our support team to initiate an international return. Refunds for international orders will be processed once the returned items are received at our warehouse.",
  },
  {
    title: "10. Promotional Discounts",
    content:
      "In the event of a return, any promotional discount or coupon applied to the order is forfeited and cannot be reused. The refund amount will reflect the actual amount paid for the returned item(s), not the full retail value.",
  },
  {
    title: "11. Contact Us",
    content:
      "If you have any questions about our Refund Policy or need assistance with a return, please reach out to our support team. We are here to help and will respond as quickly as possible.",
  },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Refund Policy" />

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
            Refund
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
