export const privacyPolicyData = {
  metadata: {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your personal information",
    lastUpdated: "December 18, 2024",
    effectiveDate: "December 18, 2024",
    icon: "Shield",
    iconColor: "blue-400",
    gradientFrom: "blue-300",
    gradientTo: "white",
  },
  quickSummary: {
    title: "Quick Summary",
    content:
      "We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our counter animation platform.",
  },
  sections: [
    {
      id: "information-collection",
      title: "Information We Collect",
      subsections: [
        {
          title: "Personal Information",
          content:
            "When you create an account or use our services, we may collect:",
          items: [
            "Name and email address (via Clerk authentication)",
            "Profile information you choose to provide",
            "Payment information (processed securely through Lemon Squeezy)",
            "Communication preferences and settings",
          ],
        },
        {
          title: "Payment and Financial Information",
          content:
            "When you make payments or subscribe to our services, we may collect:",
          items: [
            "Billing name and address for tax and compliance purposes",
            "Payment method details (last 4 digits of card, expiry date) - handled by Lemon Squeezy",
            "Transaction history and subscription status",
            "Tax identification numbers where legally required",
            "Invoice and receipt information for accounting purposes",
          ],
        },
        {
          title: "Usage Data",
          content:
            "We automatically collect information about how you use our platform:",
          items: [
            "Device information (browser type, operating system)",
            "IP address and location data",
            "Usage patterns and feature interactions",
            "Performance metrics and error logs",
            "Created content and project data",
          ],
        },
        {
          title: "Cookies and Tracking",
          content:
            "We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie preferences through your browser settings.",
        },
      ],
    },
    {
      id: "information-usage",
      title: "How We Use Your Information",
      content: "We use your personal information for the following purposes:",
      items: [
        "Providing and maintaining our animation platform services",
        "Processing payments and managing subscriptions",
        "Personalizing your user experience",
        "Communicating important updates and notifications",
        "Providing customer support and technical assistance",
        "Improving our services through analytics and feedback",
        "Ensuring platform security and preventing fraud",
        "Complying with legal obligations and regulations",
      ],
    },
    {
      id: "information-sharing",
      title: "Information Sharing and Disclosure",
      subsections: [
        {
          title: "Third-Party Service Providers",
          content:
            "We share information with trusted third-party providers who assist in operating our platform and are bound by strict data protection agreements:",
          items: [
            "<strong>Clerk:</strong> Authentication and user management services - processes name, email, and login data",
            "<strong>Lemon Squeezy:</strong> Payment processing and subscription management - handles payment information, billing address, and transaction data",
            "<strong>Supabase:</strong> Database and backend infrastructure - stores user data and application content",
            "<strong>Vercel:</strong> Hosting and content delivery services - processes usage data and performance metrics",
            "<strong>Analytics Providers:</strong> Anonymous usage analytics to improve our services",
          ],
        },
        {
          title: "Payment Data Handling",
          content:
            "We do not store your payment card information on our servers. All payment processing is handled by Lemon Squeezy, which is:",
          items: [
            "PCI DSS Level 1 certified for secure payment processing",
            "Compliant with international payment security standards",
            "Subject to regular security audits and compliance reviews",
            "Responsible for securing all payment card and financial data",
          ],
        },
        {
          title: "Legal Requirements",
          content:
            "We may disclose your information when required by law, court order, or to protect our rights, property, or safety, or that of our users or the public.",
        },
        {
          title: "Business Transfers",
          content:
            "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, subject to the same privacy protections.",
        },
      ],
    },
    {
      id: "data-security",
      title: "Data Security",
      content:
        "We implement industry-standard security measures to protect your personal information. Our comprehensive security program includes:",
      items: [
        "<strong>Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption",
        "<strong>Access Controls:</strong> Strict role-based access controls with multi-factor authentication for our team",
        "<strong>Regular Audits:</strong> Quarterly security audits and vulnerability assessments by third-party experts",
        "<strong>PCI Compliance:</strong> Payment processing through PCI DSS Level 1 compliant providers only",
        "<strong>Data Backups:</strong> Regular encrypted backups with secure disaster recovery procedures",
        "<strong>Incident Response:</strong> 24/7 monitoring with rapid incident response protocols",
        "<strong>Employee Training:</strong> Regular security training and background checks for all personnel",
      ],
      additionalContent:
        "While we implement robust security measures and continuously monitor for threats, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but maintain cyber liability insurance and work with leading security firms to ensure the highest level of protection possible. In the unlikely event of a data breach affecting your personal information, we will notify you within 72 hours as required by applicable data protection laws.",
    },
    {
      id: "user-rights",
      title: "Your Rights and Choices",
      content:
        "You have the following rights regarding your personal information:",
      items: [
        "<strong>Access:</strong> Request a copy of your personal data",
        "<strong>Correction:</strong> Update or correct inaccurate information",
        "<strong>Deletion:</strong> Request deletion of your personal data",
        "<strong>Portability:</strong> Receive your data in a portable format",
        "<strong>Restriction:</strong> Limit how we process your information",
        "<strong>Objection:</strong> Object to certain types of processing",
        "<strong>Withdrawal:</strong> Withdraw consent for data processing",
      ],
      additionalContent:
        'To exercise these rights, please contact us using the information provided in the "Contact Us" section below.',
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      content:
        "As a global service registered in India, we may transfer your personal information to countries outside your residence. We ensure appropriate safeguards are in place to protect your data during international transfers, including:",
      items: [
        "Adequacy decisions by relevant data protection authorities",
        "Standard contractual clauses approved by regulatory bodies",
        "Certification schemes and codes of conduct",
        "Binding corporate rules for intra-group transfers",
      ],
    },
    {
      id: "data-retention",
      title: "Data Retention",
      content:
        "We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods include:",
      items: [
        "Account information: Until account deletion or 3 years after last activity",
        "Payment records: 7 years for tax and accounting purposes",
        "Usage logs: 2 years for security and analytics purposes",
        "Support communications: 3 years after resolution",
      ],
    },
    {
      id: "childrens-privacy",
      title: "Children's Privacy",
      content:
        "Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.",
    },
    {
      id: "policy-changes",
      title: "Changes to This Policy",
      content:
        "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:",
      items: [
        "Posting the updated policy on our website",
        "Sending email notifications to registered users",
        "Displaying prominent notices within our platform",
      ],
      additionalContent:
        "Your continued use of our services after the effective date of any changes constitutes acceptance of the updated policy.",
    },
    {
      id: "contact-information",
      title: "Contact Information",
      content:
        "If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
      contactInfo: {
        company: "Countable",
        address: "India",
        
      },
    },
    {
      id: "governing-law",
      title: "Governing Law",
      content:
        "This Privacy Policy is governed by and construed in accordance with the laws of India. Any disputes arising from this policy shall be subject to the exclusive jurisdiction of the courts in India, while respecting applicable international data protection regulations including GDPR for EU residents and CCPA for California residents.",
    },
  ],
  effectiveNotice: {
    title: "Effective Date",
    content:
      "This Privacy Policy is effective as of December 18, 2024, and applies to all information collected by Countable.",
    bgColor: "blue-500/10",
    borderColor: "blue-500/20",
    textColor: "blue-300",
  },
};
