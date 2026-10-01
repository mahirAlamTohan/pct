export interface FAQ {
  question: string
  answer: string
}

export const FAQS: FAQ[] = [
  {
    question: "How can I pay?",
    answer:
      "Our preferred payment methods are Bitcoin (BTC), USDT (ERC-20), USDT (TRC-20), Ethereum (ETH), and USDC (ERC-20).",
  },
  {
    question: "How do you ship, and where are orders shipped from?",
    answer:
      "Packages are dispatched from India using India Post or another postal service, depending on the circumstances. Customs declarations are made according to the applicable shipping and customs requirements at the time of dispatch.",
  },
  {
    question:
      "What should I do if my order is missing an item or I receive a different brand?",
    answer:
      "Please contact us so we can review the order. If an item was omitted during fulfillment, we will arrange to send it promptly or, with your approval, include it with your next order. If a product is unavailable, we may offer an alternative of equivalent or higher value.",
  },
  {
    question: "Why hasn't my tracking information been updated?",
    answer:
      "International shipments can sometimes go for up to two weeks without a tracking update. We will do our best to help with tracking inquiries, but scans and delivery updates ultimately depend on the postal and logistics services handling the shipment.",
  },
  {
    question: "What is your reshipment policy?",
    answer:
      "All purchases are final and refunds are not offered. For eligible international orders, a reshipment may be considered when a shipment is confirmed as seized with appropriate documentation, appears lost in transit, or has had no tracking update for more than 20 days. Store credit may be offered in some circumstances.",
  },
  {
    question: "What happens if a reshipment is also seized?",
    answer:
      "Refunds are not offered if a replacement shipment is subsequently seized. Depending on the circumstances, we may offer the affected products at base cost for another attempt.",
  },
  {
    question: "Which countries are you currently shipping to?",
    answer:
      "We currently ship only to the USA, UK, New Zealand, and Australia. At present, we do not ship to European countries or Canada.",
  },
  {
    question: "How long does processing and delivery take?",
    answer:
      "Please allow 2–5 business days for your order to be packaged and dispatched. International delivery typically takes approximately 2–3 weeks, though transit times vary. We recommend allowing at least four weeks before submitting a delivery-related complaint.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer:
      "There is no minimum order quantity. Orders can be placed for any quantity offered in the catalog.",
  },
  {
    question: "Do I need to sign for my package?",
    answer:
      "A signature may be required by the local delivery service. Please follow the delivery requirements applicable to your shipment and contact the carrier if you have questions about a signature request.",
  },
  {
    question: "Do I need to use my real name on the shipping address?",
    answer:
      "Please provide accurate recipient and delivery information. Inaccurate or misleading information may cause delays or delivery problems, so make sure the name and address are sufficient for successful delivery.",
  },
]
